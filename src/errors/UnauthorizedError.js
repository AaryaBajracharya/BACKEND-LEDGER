import AppError from './AppError.js';

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details = undefined) {
    super(message, AppError.UNAUTHORIZED, details);
  }
}

export default UnauthorizedError;
