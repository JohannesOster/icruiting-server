import {pino} from 'pino';
import https from 'https';
import http from 'http';
import config from 'config';

const Logger = () => {
  const ops =
    config.get('env') === 'test'
      ? {level: 'silent'}
      : {
          level: 'info', // 'debug' | 'info' | 'warn' | 'error' | 'critical';
          transport: {target: 'pino-pretty', options: {colorize: true, sync: true}},
        };
  const pino = require('pino');

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

  // Only publishes in production - dev/test have no NTFY_TOPIC configured.
  const ntfy = (
    message: string,
    options: {title?: string; priority?: string; tags?: string} = {},
  ) => {
    if (config.get('env') !== 'production') return;

    const topic = config.get('ntfy.topic');
    if (!topic) return;

    const baseUrl = config.get('ntfy.url') || 'https://ntfy.sh';
    const url = new URL(`${baseUrl}/${topic}`);
    const client = url.protocol === 'http:' ? http : https;

    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(options.title ? {Title: options.title} : {}),
        ...(options.priority ? {Priority: options.priority} : {}),
        ...(options.tags ? {Tags: options.tags} : {}),
      },
    });

    req.write(message);
    req.on('error', error);
    req.end();
  };

  return {debug, info, warning, error, ntfy};
};

export default Logger();
