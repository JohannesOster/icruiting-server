export class BaseError extends Error {
  constructor(message: string, statusCode: number) {
    super(message);

    Object.defineProperty(this, 'name', {value: 'BaseError'});

    Object.defineProperties(this, {
      statusCode: {value: statusCode},
    });

    Object.setPrototypeOf(this, BaseError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
