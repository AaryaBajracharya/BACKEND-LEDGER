import AppError from './AppError.js';

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details = undefined) {
    super(message, AppError.FORBIDDEN, details);
  }
}

export default ForbiddenError;
