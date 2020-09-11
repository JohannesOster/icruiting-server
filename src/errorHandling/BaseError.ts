export class BaseError extends Error {
  constructor(statusCode: number, message: string) {
    super(message);

    Object.defineProperty(this, 'name', {value: 'BaseError'});

    Object.defineProperties(this, {
      statusCode: {value: statusCode},
    });

    Object.setPrototypeOf(this, BaseError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
