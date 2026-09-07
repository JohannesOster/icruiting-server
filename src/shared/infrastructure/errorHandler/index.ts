import * as Http from 'http';
import * as util from 'util';
import logger from 'shared/infrastructure/logger';
import {BaseError} from 'application';

const ErrorHandler = () => {
  let httpServerRef: Http.Server;
  const listenToErrorEvents = (httpServer: Http.Server) => {
    httpServerRef = httpServer;
    process.on('uncaughtException', async (error) => {
      await handleError(error);
    });

    process.on('unhandledRejection', async (reason) => {
      await handleError(reason);
    });

    process.on('SIGTERM', async () => {
      logger.error('App received SIGTERM event, try to gracefully close the server');
      await terminateHttpServerAndExit();
    });

    process.on('SIGINT', async () => {
      logger.error('App received SIGINT event, try to gracefully close the server');
      await terminateHttpServerAndExit();
    });
  };

  const handleError = (errorToHandle: unknown) => {
    try {
      const appError: BaseError = normalizeError(errorToHandle);
      logger.error(appError.message, appError);

      // 4xx are expected: bad input, missing/invalid auth, not found. Only server-side
      // failures point at a bug or weakness, so only those are worth a notification.
      if (appError.statusCode >= 500) {
        logger.ntfy(JSON.stringify({appError, stack: appError.stack}), {
          title: `icruiting error ${appError.statusCode}`,
          priority: 'high',
          tags: 'rotating_light',
        });
      }

      // Unknown error (non-trusted) is being thrown - crash app
      if (!appError.isTrusted) terminateHttpServerAndExit();
    } catch (handlingError: unknown) {
      // Not using the logger here because it might have failed
      process.stdout.write(
        'The error handler failed, here are the handler failure and then the origin error that it tried to handle',
      );
      process.stdout.write(JSON.stringify(handlingError));
      process.stdout.write(JSON.stringify(errorToHandle));
    }
  };

  // The input might not be 'BaseError' or even 'Error' instance, the output of this function will be - BaseError.
  const normalizeError = (errorToHandle: unknown): BaseError => {
    if (errorToHandle instanceof BaseError) return errorToHandle;
    if (errorToHandle instanceof Error) {
      // Libraries like body-parser signal client errors by setting status/statusCode on a
      // plain Error (malformed JSON -> 400). Honour that, otherwise every bot posting
      // garbage normalizes to 500 and pages someone. No status means a real crash.
      const {statusCode, status} = errorToHandle as {statusCode?: number; status?: number};
      const appError = new BaseError(
        statusCode ?? status ?? 500,
        errorToHandle.message,
        errorToHandle.name,
      );
      appError.stack = errorToHandle.stack;
      return appError;
    }
    // meaning it could be any type,
    const inputType = typeof errorToHandle;
    return new BaseError(
      500,
      `Error Handler received a none error instance with type - ${inputType}, value - ${util.inspect(
        errorToHandle,
      )}`,
      'general-error',
    );
  };

  const terminateHttpServerAndExit = () => {
    // maybe implement more complex logic here (like using 'http-terminator' library)
    if (httpServerRef) {
      httpServerRef.close();
    }
    process.exit();
  };

  return {listenToErrorEvents, handleError};
};

const errorHandler = ErrorHandler();
export {errorHandler};
