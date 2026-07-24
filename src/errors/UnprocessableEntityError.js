import AppError from './AppError.js';

class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity', details = undefined) {
    super(message, AppError.UNPROCESSABLE_ENTITY, details);
  }
}

export default UnprocessableEntityError;
