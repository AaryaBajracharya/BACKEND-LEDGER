import { DataTypes, Model } from 'sequelize';
import {sequelize} from '../config/db.config.js';

class blacklist extends Model {}

blacklist.init({
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    blacklistedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, 
{
    sequelize,
    modelName: 'blacklist',
    tableName: 'blacklist',
    timestamps: true, // Automatically handles createdAt and updatedAt
    
  }
)

export default blacklist;



