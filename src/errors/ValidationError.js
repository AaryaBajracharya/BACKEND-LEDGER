import AppError from './AppError.js';

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = undefined) {
    super(message, AppError.BAD_REQUEST, details);
  }
}

export default ValidationError;
