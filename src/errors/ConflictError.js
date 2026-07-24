import AppError from './AppError.js';

class ConflictError extends AppError {
  constructor(message = 'Conflict', details = undefined) {
    super(message, AppError.CONFLICT, details);
  }
}

export default ConflictError;
