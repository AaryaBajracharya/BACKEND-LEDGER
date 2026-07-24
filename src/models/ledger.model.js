import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.config.js';
class Ledger extends Model{}

Ledger.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    accountId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'accounts', // Links to your accounts table
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2), // Exact monetary precision
        allowNull: false,
    },
    balanceAfter: {
        type: DataTypes.DECIMAL(12, 2), // Tracks the account balance immediately after this entry
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('CREDIT', 'DEBIT'),
        allowNull: false,
    },
    idempotencyKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Prevents duplicate request processing
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    sequelize,
    modelName: 'Ledger',
    tableName: 'ledgers',
    timestamps: true,
    underscored: true, // Enforces postgres-friendly snake_case (e.g., account_id)
});

const ledgerModificationPrevention = () => {
    throw new Error("Ledger entries are immutable and cannot be modified or deleted");
};

Ledger.addHook('beforeUpdate', ledgerModificationPrevention);
Ledger.addHook('beforeDestroy', ledgerModificationPrevention);
Ledger.addHook('beforeBulkUpdate', ledgerModificationPrevention);
Ledger.addHook('beforeBulkDestroy', ledgerModificationPrevention);
Ledger.addHook('beforeUpsert', ledgerModificationPrevention);

export default Ledger;