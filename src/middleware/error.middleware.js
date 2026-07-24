
import { AppError, BadRequestError, ConflictError, UnauthorizedError, InternalServerError, ValidationError,} from '../errors/index.js';


const handleSequelizeValidation = (err) => {
  const rawErrors =  err.issues || err.errors || [];

  const validationErrors = rawErrors.map((item) => ({
    path: Array.isArray(item.path) ? item.path.join('.') : item.path,
    message: item.message,
  }));

  const message = validationErrors.length
    ? validationErrors.map((error) => error.message).join('. ')
    : 'Validation failed';
  return new ValidationError(message, { validation: validationErrors });
};

const handleSequelizeUniqueConstraint = (err) => {
  const constraintErrors = err.errors?.map((error) => ({
    path: error.path,
    value: error.value,
    message: error.message,
  })) || [];

  const field = err.errors?.[0]?.path || 'field';
  return new ConflictError(`${field} already in use`, { constraint: constraintErrors });
};

const handleJWTError = () => new UnauthorizedError('Invalid token. Please log in again.');
const handleJWTExpiredError = () => new UnauthorizedError('Your token has expired. Please log in again.');
const handleSyntaxError = (err) => new BadRequestError(err.message || 'Malformed JSON payload.');



const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'SequelizeValidationError' || err.name === 'ZodError') {
    error = handleSequelizeValidation(err);
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    error = handleSequelizeUniqueConstraint(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = handleSyntaxError(err);
  }


  if (!(error instanceof AppError)) {
    error = new InternalServerError('Something went wrong');
    error.isOperational = false;
  }

  if (!error.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
  }
  

  const payload = {
    status: error.status,
    message: error.message,
  };

  if (error.details) {
    payload.details = error.details;
  }

  res.status(error.statusCode).json(payload);
};

const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

export { errorHandler, catchAsync };
