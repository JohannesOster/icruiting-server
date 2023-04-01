import * as Http from 'http';
import https from 'https';
import * as util from 'util';
import logger from 'shared/infrastructure/logger';
import {BaseError} from 'application';
import config from 'config';

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

      if (![400, 404, 422].includes(appError.statusCode)) {
        sendDiscordMessage(JSON.stringify({appError, stack: appError.stack}));
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

  const sendDiscordMessage = (content: string) => {
    const req = https.request({
      method: 'POST',
      host: 'discord.com',
      path: config.get('discordWebHook'),
      headers: {'Content-Type': 'application/json'},
    });
    req.write(JSON.stringify({content}));
    req.on('error', logger.error);
    req.end();
  };

  // The input might not be 'BaseError' or even 'Error' instance, the output of this function will be - BaseError.
  const normalizeError = (errorToHandle: unknown): BaseError => {
    if (errorToHandle instanceof BaseError) return errorToHandle;
    if (errorToHandle instanceof Error) {
      const appError = new BaseError(500, errorToHandle.message, errorToHandle.name);
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
