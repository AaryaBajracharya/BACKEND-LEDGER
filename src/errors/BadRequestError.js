import AppError from './AppError.js';

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = undefined) {
    super(message, AppError.BAD_REQUEST, details);
  }
}

export default BadRequestError;
