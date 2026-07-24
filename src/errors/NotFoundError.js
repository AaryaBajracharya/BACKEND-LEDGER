import AppError from './AppError.js';

class NotFoundError extends AppError {
  constructor(message = 'Not Found', details = undefined) {
    super(message, AppError.NOT_FOUND, details);
  }
}

export default NotFoundError;
