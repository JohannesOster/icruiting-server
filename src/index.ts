import app from 'infrastructure/http';
import config from 'config';
import {errorHandler} from 'shared/infrastructure/errorHandler';
import logger from 'shared/infrastructure/logger';

const port = config.get('port');

const server = app.listen(port, () => {
  errorHandler.listenToErrorEvents(server);
  if (process.env.NODE_ENV === 'development') {
    logger.info(`Listening: http://localhost:${port}`);
  }
});
