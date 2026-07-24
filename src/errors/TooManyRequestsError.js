import AppError from './AppError.js';

class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests, please try again later.', details = undefined) {
    super(message, AppError.TOO_MANY_REQUESTS, details);
  }
}

export default TooManyRequestsError;
