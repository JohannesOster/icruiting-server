import {pino} from 'pino';

const Logger = () => {
  const ops = {
    level: 'info', // 'debug' | 'info' | 'warn' | 'error' | 'critical';
    transport: {target: 'pino-pretty', options: {colorize: true, sync: true}},
  };

  const _logger = pino(ops);

  const debug = (message: string, ...args: unknown[]) => {
    _logger.debug(message, ...args);
  };

  const info = (message: string, ...args: unknown[]) => {
    _logger.info(message, ...args);
  };

  const warning = (message: string, ...args: unknown[]) => {
    _logger.warn(message, ...args);
  };

  const error = (message: string, ...args: unknown[]) => {
    _logger.error(message, ...args);
  };

  return {debug, info, warning, error};
};

export default Logger();
