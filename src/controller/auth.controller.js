import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { sendRegistrationEmail } from '../services/email.service.js';

const JWT_OPTIONS = { expiresIn: '3d' };

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, JWT_OPTIONS);
};

const buildUserPayload = (user) => {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

const UserRegister = async (req, res) => {
    try {
        const { email, password, name } = req.body || {};

        if (!email || !password || !name) {
            return res.status(400).json({
                message: 'Name, email, and password are required.',
                status: 'failed',
            });
        }

        const isExists = await userModel.findOne({ where: { email } });

        if (isExists) {
            return res.status(422).json({
                message: 'User already exists with this email.',
                status: 'failed',
            });
        }

        const user = await userModel.create({ email, password, name });
        const token = generateToken(user.id);

        res.cookie('jwt_token', token);

        sendRegistrationEmail(user.email, user.name).catch(err =>
            console.error('Email failed:', err)
        );

        return res.status(201).json({
            user: buildUserPayload(user),
            token,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: 'failed',
        });
    }
};

const UserLogin = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.',
                status: 'failed',
            });
        }

        const user = await userModel.unscoped().findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                message: 'Email or password is invalid.',
                status: 'failed',
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Email or password is invalid.',
                status: 'failed',
            });
        }

        const token = generateToken(user.id);

        res.cookie('jwt_token', token);

        return res.status(200).json({
            user: buildUserPayload(user),
            token,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: 'failed',
        });
    }
};

export { UserRegister, UserLogin };