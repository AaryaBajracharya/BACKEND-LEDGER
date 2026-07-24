import express from 'express';
import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js'
import transactionRoutes from './routes/transaction.routes.js'
import cookieParser from 'cookie-parser'
import {rateLimit} from './middleware/rateLimiter.middleware.js'
import { errorHandler } from './middleware/error.middleware.js';

const app = express();


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())



app.use("/api/auth", authRoutes);
app.use("/api/account",rateLimit(60_000, 2), accountRoutes);
app.use("/api/transaction",rateLimit(60_000, 20), transactionRoutes);

app.use(errorHandler);

export default app;
