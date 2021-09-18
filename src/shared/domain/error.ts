enum ErrorCode {
  VALIDATION_ERROR,
}

export class BaseError extends Error {
  constructor(code: ErrorCode, message?: string) {
    super(message);

    Object.defineProperties(this, {
      code: {value: code},
    });

    Object.setPrototypeOf(this, BaseError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(ErrorCode.VALIDATION_ERROR, message);
    Object.defineProperty(this, 'name', {value: ErrorCode.VALIDATION_ERROR});
    Object.setPrototypeOf(this, ValidationError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
