import { DataTypes, Model } from 'sequelize';
import {sequelize} from '../config/db.config.js';

class refreshToken extends Model {}

refreshToken.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
   
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true, // Optional field
    }
}, 
{
    sequelize,
    modelName: 'refreshToken',
    tableName: 'req_tokens',
    timestamps: true, // Automatically handles createdAt and updatedAt
    
  }
)

export default refreshToken;


