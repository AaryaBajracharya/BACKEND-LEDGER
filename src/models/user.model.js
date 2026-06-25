import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import {sequelize} from '../config/db.js'; 

class User extends Model {
    async comparePassword(password) {
        return await bcrypt.compare(password, this.password);
    }
}

User.init({
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: { msg: 'Please fill a valid email address' },
            notNull: { msg: 'Email is required' }
        },
        set(value) {
            this.setDataValue('email', value.trim().toLowerCase());
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: 'Name is required' }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: 'Password is required' },
            len: {
                args: [6, 100],
                msg: 'Password must be at least 6 characters'
            }
        }
    }
}, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['password'] }  // hides password by default
    },
    hooks: {
        beforeCreate: async (user) => {
            user.password = await bcrypt.hash(user.password, 10);
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {  // only re-hash if password changed
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
});

export default User;