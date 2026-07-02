import { DataTypes, Model } from 'sequelize';
import {sequelize} from '../config/db.js'; // Your Sequelize connection instance

class Account extends Model {

  async getBalance(){

    const {default :Ledger} =await import ('./Ledger.js');

    const result = await Ledger.findOne({

      where: { accountId: this.id },
      attributes:[
         [fn('SUM', literal(`CASE WHEN "type" = 'CREDIT' THEN "amount" ELSE 0 END`)), 'totalCredit'],
        [fn('SUM', literal(`CASE WHEN "type" = 'DEBIT' THEN "amount" ELSE 0 END`)), 'totalDebit'],
      ],
      raw: true,
    });

    const totalCredit = Number(result?.totalCredit) || 0;
    const totalDebit = Number(result?.totalDebit) || 0;

    return totalCredit - totalDebit;

  }
}

Account.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Assuming a relationship with a User model
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // Name of the target table
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'FROZEN', 'CLOSED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: {
          args: [['ACTIVE', 'FROZEN', 'CLOSED']],
          msg: 'Status can be either ACTIVE, FROZEN or CLOSED',
        },
      },
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'NRP',
      validate: {
        notNull: {
          msg: 'Currency is required for creating an account',
        },
        notEmpty: {
          msg: 'Currency is required for creating an account',
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'Account',
    tableName: 'accounts',
    timestamps: true, // Automatically handles createdAt and updatedAt
    indexes: [
      {
        // Replicating the compound index: accountSchema.index({ user: 1, status: 1 })
        unique: false, 
        fields: ['userId', 'status'],
      },
    ],
  }
);



export default Account;