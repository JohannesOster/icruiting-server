import {pino} from 'pino';
import https from 'https';
import config from 'config';

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

  const discord = (message: string) => {
    const req = https.request({
      method: 'POST',
      host: 'discord.com',
      path: config.get('discordWebHook'),
      headers: {'Content-Type': 'application/json'},
    });

    req.write(message);
    req.on('error', error);
    req.end();
  };

  return {debug, info, warning, error, discord};
};

export default Logger();
