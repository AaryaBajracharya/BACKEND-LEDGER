import { UserSchema, User } from '../models/user.model.js'; 
import jwt from 'jsonwebtoken';
import { sendRegistrationEmail } from '../services/email.service.js';
import { setAccessToken } from '../services/tokenCache.service.js';
import refreshTokenModel from '../models/refreshToken.model.js';
import { AppError, BadRequestError, UnauthorizedError, InternalServerError } from '../errors/index.js';
import { catchAsync } from '../middleware/error.middleware.js';
import { z } from 'zod'; // Imported to handle explicit Zod validation error checks if needed
import { 
    ACCESS_TOKEN_OPTIONS,
    REFRESH_TOKEN_OPTIONS,
    ACCESS_COOKIE_OPTIONS, 
    REFRESH_COOKIE_OPTIONS,
    ACCESS_TOKEN_MAX_AGE_MS, 
    REFRESH_TOKEN_MAX_AGE_MS } 
    from '../config/token.config.js';
import { emailQueue } from '../queues/emailQueue.js';

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, REFRESH_TOKEN_OPTIONS);
};

const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, ACCESS_TOKEN_OPTIONS);
};

const issueTokenPair = async (res, userId) => {
    const refreshToken = generateRefreshToken(userId);
    const accessToken = generateAccessToken(userId);

    const decodedRefreshToken = jwt.decode(refreshToken);
    const expiresAt = decodedRefreshToken?.exp
        ? new Date(decodedRefreshToken.exp * 1000)
        : new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

    await refreshTokenModel.create({ userId, token: refreshToken, expiresAt });
    await setAccessToken(userId, accessToken, ACCESS_TOKEN_MAX_AGE_MS / 1000);

    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    return accessToken;
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

const UserRegister = catchAsync(async (req, res) => {
    // 1. Validate payload with Zod. If it fails, .parse() throws a ZodError automatically.
    // catchAsync will pass any thrown ZodError downward to your global error middleware.
    const validatedData = UserSchema.parse(req.body);

    // 2. Destructure the safely sanitized fields returned by Zod
    const { email, password, name } = validatedData;

    // Fixed: changed from userModel to your imported User class
    const user = await User.create({ email, password, name }); 
    const token = await issueTokenPair(res, user.id);

    try {
         await emailQueue.add('registration-email', {
         email: user.email,
         name: user.name,
        });

    } catch (err){
         console.error('Email failed:', err);
    }

    return res.status(AppError.CREATED).json({
        user: buildUserPayload(user),
        token,
    });
});

const UserLogin = catchAsync(async (req, res) => {
    // 1. For login, pick only email and password from the base schema to validate layout structure
    const loginSchema = UserSchema.pick({ email: true, password: true });
    const validatedData = loginSchema.parse(req.body);
    
    const { email, password } = validatedData;

    // Fixed: changed from userModel to your imported User class
    const user = await User.unscoped().findOne({ where: { email } });

    if (!user) {
        throw new UnauthorizedError('Email or password is invalid.');
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
        throw new UnauthorizedError('Email or password is invalid.');
    }

    const token = await issueTokenPair(res, user.id);
   
    return res.status(AppError.OK).json({
        user: buildUserPayload(user),
        token,
    });
});

const UserLogout = catchAsync(async (req, res) => {
    const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];
    const refreshToken = req.cookies.refresh_token;

    if (!token) {
        throw new BadRequestError('No token provided.');
    }

    res.clearCookie('access_token', ACCESS_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);

    try {
        const decoded = jwt.decode(token);

        const expiresAt = decoded?.exp
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + ACCESS_TOKEN_MAX_AGE_MS);

        if (refreshToken) {
            await refreshTokenModel.destroy({ where: { token: refreshToken } });
        }
    } catch (error) {
        throw new InternalServerError('Failed to blacklist token.');
    }

    res.status(AppError.OK).json({
        message: 'User logged out successfully.',
        status: 'success',
    });
});

const RefreshAccessToken = catchAsync(async (req, res) => {
    const incomingRefreshToken = req.cookies.refresh_token;

    if (!incomingRefreshToken) {
        throw new UnauthorizedError('Refresh token missing.');
    }
   
    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        res.clearCookie('access_token', ACCESS_COOKIE_OPTIONS);
        res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
        throw new UnauthorizedError('Refresh token is invalid or expired.');
    }

    const storedToken = await refreshTokenModel.findOne({
        where: { token: incomingRefreshToken, userId: decoded.userId },
    });

    if (!storedToken) {
        res.clearCookie('access_token', ACCESS_COOKIE_OPTIONS);
        res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
        throw new UnauthorizedError('Refresh token is invalid or has been revoked.');
    }

    await storedToken.destroy();
    const newAccessToken = await issueTokenPair(res, decoded.userId);

    return res.status(AppError.OK).json({
        token: newAccessToken,
        status: 'success',
    });
});

export { UserRegister, UserLogin, UserLogout, RefreshAccessToken };
