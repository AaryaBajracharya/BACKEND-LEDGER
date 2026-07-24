import AppError from './AppError.js';

class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details = undefined) {
    super(message, AppError.INTERNAL_SERVER_ERROR, details);
  }
}

export default InternalServerError;
