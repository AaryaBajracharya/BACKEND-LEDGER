
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.config.js';

class Transaction  extends Model{}

Transaction.init(
    {

        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,

        },

        fromAccountId:{
            type: DataTypes.UUID,
            allowNull: true,
            references: {

                model: 'accounts',
                key: 'id',

            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        
        },
        
        toAccountId: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
            model: 'accounts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Prevent deletion if there are associated transactions
        },

        amount: {
            type: DataTypes.DECIMAL(12,2),
            allowNull: false,
            validate: {
                min: 0.01,
            },
        },

        type: {
            type: DataTypes.ENUM('TRANSFER', 'DEPOSIT', 'WITHDRAWAL'),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED','REVERSED'),
            defaultValue: 'PENDING',
        },
        reference: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },

        idempotencyKey: {
        type: DataTypes.STRING, // Or DataTypes.STRING if you generate unique tokens differently
        allowNull: false,
        unique: true, // Crucial: This prevents a duplicate request from inserting a new row
        }
    },

    {
        sequelize,
        modelName: 'Transaction',
        tableName: 'transactions', // Explicit lowercase plural naming (PostgreSQL standard)
        timestamps: true,          // Automatically handles createdAt and updatedAt fields
        underscored: true,         // Converts camelCase fields to snake_case in Postgres (e.g., from_account_id)
    }

   
);

export default Transaction;








