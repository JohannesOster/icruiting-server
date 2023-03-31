export class BaseError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorCode: string = '',
    public isTrusted = true,
    public cause?: unknown,
  ) {
    super(message);
    Object.defineProperty(this, 'name', {value: 'BaseError'});
    Object.setPrototypeOf(this, BaseError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
