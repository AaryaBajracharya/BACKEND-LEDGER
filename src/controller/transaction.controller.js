import Transaction from "../models/transaction.model.js";
import Ledger from "../models/ledger.model.js";
import Account from "../models/account.model.js";
import { User } from "../models/user.model.js";
import { sequelize } from "../config/db.config.js";
import { sendTransactionEmail, sendtransactionFailureEmail } from "../services/email.service.js";
import {
  AppError,
  BadRequestError,
  UnprocessableEntityError,
  InternalServerError,
} from "../errors/index.js";
import { catchAsync } from "../middleware/error.middleware.js";

const createTransaction = catchAsync(async (req, res) => {
    const { fromAccountId, toAccountId, amount, idempotencyKey } = req.body;

    if (!fromAccountId || !toAccountId || !amount || !idempotencyKey) {
        throw new BadRequestError(
            "fromAccountId, toAccountId, amount and idempotencyKey are required"
        );
    }

    if (amount <= 0) {
        throw new BadRequestError("Amount must be greater than zero");
    }

    if (fromAccountId === toAccountId) {
        throw new BadRequestError("Cannot transfer to the same account");
    }

    const isTransactionAlreadyExists = await Transaction.findOne({
        where: { idempotencyKey }
    });

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(AppError.OK).json({
                message: "Transaction is processed",
                transaction: isTransactionAlreadyExists
            });
        }
        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(AppError.OK).json({
                message: "Transaction is still processing"
            });
        }
        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(AppError.OK).json({
                message: "Transaction processing Failed"
            });
        }
        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(AppError.OK).json({
                message: "Transaction was reversed, Please Try Again"
            });
        }
    }

    const fromUserAccount = await Account.findByPk(fromAccountId);
    const toUserAccount = await Account.findByPk(toAccountId);

    if (!fromUserAccount || !toUserAccount) {
        throw new BadRequestError("Invalid fromAccount or toAccount");
    }

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        throw new BadRequestError(
            "Both ToAccount and FromAccount must be ACTIVE to process transaction"
        );
    }

    const fromBalance = await fromUserAccount.getBalance();
    const toBalance = await toUserAccount.getBalance();

    if (fromBalance < amount) {
        throw new UnprocessableEntityError("Insufficient balance");
    }

    let result;
    try {
        result = await sequelize.transaction(async (t) => {
            const transaction = await Transaction.create({
                fromAccountId: fromUserAccount.id,
                toAccountId: toUserAccount.id,
                amount,
                idempotencyKey,
                type: "TRANSFER",
                status: "PENDING",
            }, { transaction: t });

            await Ledger.create({
                accountId: fromUserAccount.id,
                amount: amount,
                balanceAfter: fromBalance - amount,
                type: "DEBIT",
                idempotencyKey: `${idempotencyKey}-debit`,
            }, { transaction: t });

            await Ledger.create({
                accountId: toUserAccount.id,
                amount: amount,
                balanceAfter: toBalance + amount,
                type: "CREDIT",
                idempotencyKey: `${idempotencyKey}-credit`,
            }, { transaction: t });

            transaction.status = "COMPLETED";
            await transaction.save({ transaction: t });

            return transaction;
        });
    } catch (err) {
        
        console.error("createTransaction failed:", err);
        throw new InternalServerError("Transaction failed");
    }

    
    try {
        await sendTransactionEmail(req.user.email, req.user.name, amount, toAccountId);
    } catch (emailErr) {
        console.error("Transaction email failed to send:", emailErr);
    }

    return res.status(AppError.CREATED).json({
        message: "Transaction completed successfully",
        transaction: result
    });
});

const createInitialFundsTransaction = catchAsync(async (req, res) => {
    const { toAccountId, amount, idempotencyKey } = req.body;

    if (!toAccountId || !amount || !idempotencyKey) {
        throw new BadRequestError(
            "toAccountId, amount and idempotencyKey are required"
        );
    }

    if (amount <= 0) {
        throw new BadRequestError("Amount must be greater than zero");
    }

    const isTransactionAlreadyExists = await Transaction.findOne({
        where: { idempotencyKey }
    });

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(AppError.OK).json({
                message: "Transaction is processed",
                transaction: isTransactionAlreadyExists
            });
        }
        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(AppError.OK).json({
                message: "Transaction is still processing"
            });
        }
        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(AppError.OK).json({
                message: "Transaction processing Failed"
            });
        }
        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(AppError.OK).json({
                message: "Transaction was reversed, Please Try Again"
            });
        }
    }

    const toUserAccount = await Account.findByPk(toAccountId);

    if (!toUserAccount) {
        throw new BadRequestError("Invalid toAccount");
    }

    if (toUserAccount.status !== "ACTIVE") {
        throw new BadRequestError("toAccount must be ACTIVE to process transaction");
    }

    // These two failures mean the SYSTEM is misconfigured, not that the
    // caller sent bad input — so they're 500s, not 400s
    const systemUser = await User.findOne({
        where: { systemUser: true },
        attributes: { include: ["systemUser"] }
    });

    if (!systemUser) {
        throw new InternalServerError("System user not found");
    }

    const fromUserAccount = await Account.findOne({
        where: { userId: systemUser.id }
    });

    if (!fromUserAccount) {
        throw new InternalServerError("System account not found");
    }

    const fromBalance = await fromUserAccount.getBalance();
    const toBalance = await toUserAccount.getBalance();

    let result;
    try {
        result = await sequelize.transaction(async (t) => {
            const transaction = await Transaction.create({
                fromAccountId: fromUserAccount.id,
                toAccountId: toUserAccount.id,
                amount,
                idempotencyKey,
                type: "DEPOSIT",
                status: "PENDING",
            }, { transaction: t });

            await Ledger.create({
                accountId: fromUserAccount.id,
                amount: amount,
                balanceAfter: fromBalance - amount,
                type: "DEBIT",
                idempotencyKey: `${idempotencyKey}-debit`,
            }, { transaction: t });

            await Ledger.create({
                accountId: toUserAccount.id,
                amount: amount,
                balanceAfter: toBalance + amount,
                type: "CREDIT",
                idempotencyKey: `${idempotencyKey}-credit`,
            }, { transaction: t });

            transaction.status = "COMPLETED";
            await transaction.save({ transaction: t });

            return transaction;
        });
    } catch (err) {
        console.error("createInitialFundsTransaction failed:", err);
        throw new InternalServerError("Initial funds transaction failed");
    }

    return res.status(AppError.CREATED).json({
        message: "Initial funds transaction completed successfully",
        transaction: result
    });
});

export { createTransaction, createInitialFundsTransaction };