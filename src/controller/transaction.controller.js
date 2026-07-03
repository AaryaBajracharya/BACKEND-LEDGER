import Transaction from "../models/transaction.model.js";
import Ledger from "../models/ledger.model.js";
import Account from "../models/account.model.js";
import User from "../models/user.model.js";
import { sequelize } from "../config/db.js";
import { sendTransactionEmail, sendtransactionFailureEmail } from "../services/email.service.js";

const createTransaction = async (req, res) => {
    const { fromAccountId, toAccountId, amount, idempotencyKey } = req.body;

    if (!fromAccountId || !toAccountId || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccountId, toAccountId, amount and idempotencyKey are required"
        });
    }

    const isTransactionAlreadyExists = await Transaction.findOne({
        where: { idempotencyKey }
    });

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction is processed",
                transaction: isTransactionAlreadyExists
            });
        }
        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing"
            });
        }
        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(200).json({
                message: "Transaction processing Failed"
            });
        }
        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(200).json({
                message: "Transaction was reversed, Please Try Again"
            });
        }
    }

    const fromUserAccount = await Account.findByPk(fromAccountId);
    const toUserAccount = await Account.findByPk(toAccountId);

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        });
    }

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both ToAccount and FromAccount must be ACTIVE to process transaction"
        });
    }

    const fromBalance = await fromUserAccount.getBalance();
    const toBalance = await toUserAccount.getBalance();
    
    try {
        const result = await sequelize.transaction(async (t) => {
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
                balanceAfter: fromUserAccount.balance - amount,
                type: "DEBIT",
                idempotencyKey: `${idempotencyKey}-debit`,
            }, { transaction: t });

            await Ledger.create({
                accountId: toUserAccount.id,
                amount: amount,
                balanceAfter: toUserAccount.balance + amount,
                type: "CREDIT",
                idempotencyKey: `${idempotencyKey}-credit`,
            }, { transaction: t });

            transaction.status = "COMPLETED";
            await transaction.save({ transaction: t });

            return transaction;
        });

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: result
        });

        await emailService.sendTransactionEmail(req.user.email,req.user.name,amount,toAccountId)

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: result
        });


    
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Transaction failed",
            error: err.message
        });
    }
};

const createInitialFundsTransaction = async (req, res) => {
    const { toAccountId, amount, idempotencyKey } = req.body;

    if (!toAccountId || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccountId, amount and idempotencyKey are required"
        });
    }

    const toUserAccount = await Account.findByPk(toAccountId);

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid Account"
        });
    }

    const systemUser = await User.findOne({
        where: { systemUser: true },
        attributes: { include: ["systemUser"] }
    });

    if (!systemUser) {
        return res.status(400).json({
            message: "System user not found"
        });
    }

    const fromUserAccount = await Account.findOne({
        where: { userId: systemUser.id }
    });

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System account not found"
        });
    }


    try {
        const result = await sequelize.transaction(async (t) => {
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
                balanceAfter: fromUserAccount.balance - amount,
                type: "DEBIT",
                idempotencyKey: `${idempotencyKey}-debit`,
            }, { transaction: t });

            await Ledger.create({
                accountId: toUserAccount.id,
                amount: amount,
                balanceAfter: toUserAccount.balance + amount,
                type: "CREDIT",
                idempotencyKey: `${idempotencyKey}-credit`,
            }, { transaction: t });

            transaction.status = "COMPLETED";
            await transaction.save({ transaction: t });

            return transaction;

            
        });

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: result
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Initial funds transaction failed",
            error: err.message
        });
    }
};

export { createTransaction, createInitialFundsTransaction };