import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
// import tokenBlacklistModel from '../models/tokenBlacklist.model.js';

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Unauthorized access, token is missing.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return next(new UnauthorizedError('Unauthorized access, token is invalid.'));
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(new UnauthorizedError('Unauthorized access, token is invalid.'));
  }
};

const authSystemUserMiddleware = async (req, res, next) => {
  const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Unauthorized access, token is missing.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: {
        include: ['systemUser'],
      },
    });

    if (!user) {
      return next(new UnauthorizedError('Unauthorized access, token is invalid.'));
    }

    if (!user.systemUser) {
      return next(new ForbiddenError('Forbidden access, not a system user.'));
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(new UnauthorizedError('Unauthorized access, token is invalid.'));
  }
};

export { authMiddleware, authSystemUserMiddleware };
