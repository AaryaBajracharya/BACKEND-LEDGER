# BACKEND-LEDGER

A Node.js/Express backend implementing a **double-entry bookkeeping ledger system** with JWT authentication, idempotent transactions, and PostgreSQL persistence via Sequelize.

Every account balance is derived live from an immutable ledger of CREDIT/DEBIT entries rather than stored as a mutable field — the ledger is the single source of truth.

## Features

- **Double-entry ledger** — every transaction writes a paired `DEBIT`/`CREDIT` entry to an append-only `ledgers` table. Ledger rows cannot be updated or deleted (enforced via Sequelize hooks).
- **Live balance calculation** — `Account.getBalance()` computes balance on demand as `SUM(CREDIT) - SUM(DEBIT)`, aggregated in Postgres rather than in application code.
- **Idempotent transactions** — every transaction request requires an `idempotencyKey`. Duplicate keys short-circuit and return the original result instead of double-processing.
- **Atomic transfers** — each transaction (the transaction record + both ledger entries) is wrapped in a single Sequelize managed transaction, so a failure rolls back everything.
- **JWT authentication with token blacklisting** — logout blacklists the JWT so it can no longer be used, with an hourly cron job (`node-cron`) purging expired blacklist entries.
- **System-user–gated initial funding** — new accounts are funded via a dedicated endpoint restricted to a system user, itself funded from nowhere (the origin of money in the ledger).
- **Password hashing** — bcrypt hashing via `beforeCreate`/`beforeUpdate` model hooks; password excluded from default query scope.
- **Email notifications** — registration email sent via Nodemailer/Gmail OAuth2 (best-effort, non-blocking).

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 5 |
| ORM | Sequelize 6 |
| Database | PostgreSQL |
| Auth | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| Scheduled jobs | `node-cron` |
| Email | `nodemailer` (Gmail OAuth2) |

## Architecture

### Data model

```
User ──1:N── Account ──1:N── Ledger
                  │
                  └──1:N (from/to)── Transaction
```

- **User** — account holder credentials. A `systemUser` flag marks the special account used as the origin of initial deposits. System users are immutable once created.
- **Account** — belongs to a `User`. Holds `status` (`ACTIVE` / `FROZEN` / `CLOSED`) and `currency`. Has no stored `balance` column — balance is always computed from `Ledger`.
- **Ledger** — append-only, immutable log of `CREDIT`/`DEBIT` entries against an account. Each entry records `amount`, `balanceAfter` (a point-in-time snapshot), and a unique `idempotencyKey`.
- **Transaction** — the user-facing record of a transfer/deposit (`fromAccountId` → `toAccountId`), with `status` (`PENDING` / `COMPLETED` / `FAILED` / `REVERSED`) and its own unique `idempotencyKey`.
- **Blacklist** — revoked JWTs, cleared out hourly for tokens older than 1 hour.

### How a transfer is processed

1. Validate required fields (`fromAccountId`, `toAccountId`, `amount`, `idempotencyKey`).
2. Look up `idempotencyKey` in `Transaction` — if it already exists, return its current status/result instead of reprocessing.
3. Load both accounts, confirm both are `ACTIVE`.
4. Inside a single DB transaction:
   - Create the `Transaction` row (`status: PENDING`).
   - Create a `DEBIT` ledger entry for the sender (idempotency key suffixed `-debit`).
   - Create a `CREDIT` ledger entry for the receiver (idempotency key suffixed `-credit`).
   - Mark the `Transaction` `COMPLETED`.
5. Any failure inside the block rolls back the entire transfer.

## Project Structure

```
BACKEND-LEDGER/
├── server.js                       # entrypoint: DB connect, sync, start server + cron job
├── src/
│   ├── app.js                      # Express app setup, route mounting
│   ├── config/
│   │   └── db.js                   # Sequelize/Postgres connection
│   ├── models/
│   │   ├── user.model.js
│   │   ├── account.model.js
│   │   ├── ledger.model.js
│   │   ├── transaction.model.js
│   │   └── blacklist.model.js
│   ├── controller/
│   │   ├── auth.controller.js
│   │   ├── account.controller.js
│   │   └── transaction.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── account.routes.js
│   │   └── transaction.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js      # JWT verification, system-user gate
│   ├── jobs/
│   │   └── cleanupBlacklist.job.js # hourly cron: purge expired blacklist tokens
│   └── services/
│       └── email.service.js        # Nodemailer wrapper
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (running locally or accessible remotely)

### Installation

```bash
git clone https://github.com/AaryaBajracharya/BACKEND-LEDGER.git
cd BACKEND-LEDGER
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
# Server
PORT=3000

# Database
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Auth
JWT_SECRET=your_jwt_secret

# Email (Gmail OAuth2 — optional, registration email fails silently if unset)
EMAIL_USER=your_gmail_address
CLIENT_ID=your_oauth_client_id
CLIENT_SECRET=your_oauth_client_secret
REFRESH_TOKEN=your_oauth_refresh_token
```

`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` are required — the app throws on startup if any are missing.

### Run

```bash
npm run dev     # nodemon, auto-restart
npm start        # plain node
```

On startup the app connects to Postgres and runs `sequelize.sync({ alter: true })`, which creates/updates tables to match the models automatically.

### Seeding a system user

Deposits (`/api/transaction/system/initial-funds`) require a `User` row with `systemUser: true` and an associated `Account`. This isn't created automatically — insert one manually (e.g. via a seed script or direct SQL) before testing deposits.

## API Overview

All routes are prefixed with `/api`. See `API.md` (or the Postman/Swagger docs) for full request/response details.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Log in, receive JWT |
| POST | `/api/auth/logout` | JWT | Log out, blacklist token |
| POST | `/api/account` | JWT | Create an account for the logged-in user |
| GET | `/api/account` | JWT | List the logged-in user's accounts |
| GET | `/api/account/balance/:accountId` | JWT | Get live balance for an account |
| POST | `/api/transaction` | JWT | Transfer funds between two accounts |
| POST | `/api/transaction/system/initial-funds` | System user JWT | Deposit funds into an account from the system account |

## Notes

- Balances are **never** stored — they're always recalculated from the ledger via `SUM(CREDIT) - SUM(DEBIT)`, which keeps the account's balance mathematically consistent with its transaction history at all times.
- Ledger rows are immutable by design: `beforeUpdate`/`beforeDestroy`/`beforeBulkUpdate`/`beforeBulkDestroy`/`beforeUpsert` hooks throw if modification is attempted.
- Idempotency keys are enforced at the database level via `unique: true` on both `Transaction.idempotencyKey` and `Ledger.idempotencyKey`.

## License

ISC
