class AppError extends Error {
  static OK = 200;
  static CREATED = 201;
  static NO_CONTENT = 204;

  static BAD_REQUEST = 400;
  static UNAUTHORIZED = 401;
  static FORBIDDEN = 403;
  static NOT_FOUND = 404;
  static CONFLICT = 409;
  static UNPROCESSABLE_ENTITY = 422;
  static TOO_MANY_REQUESTS = 429;

  static INTERNAL_SERVER_ERROR = 500;
  static SERVICE_UNAVAILABLE = 503;

  constructor(message, statusCode = AppError.INTERNAL_SERVER_ERROR, details = undefined) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor); //start from the error itself, removes unneccesary constructor calls
  }
}

export default AppError;
