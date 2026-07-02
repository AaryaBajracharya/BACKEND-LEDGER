import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import {sequelize} from '../config/db.js'; 

class User extends Model {
    async comparePassword(password) {
        return await bcrypt.compare(password, this.password);
    }
}

User.init({
       id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
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
    },

    systemUser: {
        type: DataTypes.BOOLEAN,
        defaultValue: false

    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    defaultScope: {
        attributes: {exclude: ['password', 'systemUser']  } // hides password by default
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

const SystemUserModificationPrevention = (user) => {
    if(user.systemUser){
    throw new Error("System Users are immutable and cannot be modified or deleted");}
};

User.addHook('beforeUpdate',SystemUserModificationPrevention);
User.addHook('beforeDestroy', SystemUserModificationPrevention);



export default User;