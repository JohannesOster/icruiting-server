jest.mock('shared/infrastructure/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    ntfy: jest.fn(),
  },
}));

import logger from 'shared/infrastructure/logger';
import {BaseError} from 'application';
import {errorHandler} from './index';

const mockedNtfy = logger.ntfy as jest.Mock;
const mockedError = logger.error as jest.Mock;

describe('errorHandler.handleError', () => {
  // handleError exits the process for non-trusted errors; every case below is trusted,
  // so a call here means the filter logic changed and would otherwise kill the worker.
  const exit = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    exit.mockRestore();
  });

  describe('expected client errors', () => {
    it.each([400, 401, 403, 404, 422])('does not notify on %i', (statusCode) => {
      errorHandler.handleError(new BaseError(statusCode, 'expected'));

      expect(mockedNtfy).not.toHaveBeenCalled();
    });

    it('still logs them locally', () => {
      errorHandler.handleError(new BaseError(401, 'Missing Authorization header'));

      expect(mockedError).toHaveBeenCalled();
      expect(mockedNtfy).not.toHaveBeenCalled();
    });
  });

  describe('unexpected server errors', () => {
    it.each([500, 502, 503])('notifies on %i', (statusCode) => {
      errorHandler.handleError(new BaseError(statusCode, 'boom'));

      expect(mockedNtfy).toHaveBeenCalledTimes(1);
    });

    it('notifies with the message and stack, titled by status code', () => {
      errorHandler.handleError(new BaseError(500, 'boom'));

      const [body, options] = mockedNtfy.mock.calls[0];
      expect(body).toContain('boom');
      expect(options).toMatchObject({title: 'icruiting error 500', priority: 'high'});
    });

    it('notifies on a plain Error, normalized to 500', () => {
      errorHandler.handleError(new Error('kaboom'));

      expect(mockedNtfy).toHaveBeenCalledTimes(1);
      expect(mockedNtfy.mock.calls[0][1]).toMatchObject({title: 'icruiting error 500'});
    });

    it('notifies on a thrown non-error value, normalized to 500', () => {
      errorHandler.handleError('just a string');

      expect(mockedNtfy).toHaveBeenCalledTimes(1);
    });

    it('does not terminate the process for trusted errors', () => {
      errorHandler.handleError(new BaseError(500, 'boom'));

      expect(exit).not.toHaveBeenCalled();
    });
  });
});
