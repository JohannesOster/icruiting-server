jest.mock('https', () => ({request: jest.fn()}));
jest.mock('http', () => ({request: jest.fn()}));
jest.mock('config', () => ({
  __esModule: true,
  // Logger() reads config.get('env') once at import time to pick pino's transport -
  // keep it 'test' (silent) here so importing this file never spins up pino-pretty.
  default: {get: jest.fn((key: string) => (key === 'env' ? 'test' : ''))},
}));

import https from 'https';
import http from 'http';
import config from 'config';
import logger from './logger';

const mockedConfigGet = config.get as jest.Mock;
const fakeReq = () => ({write: jest.fn(), on: jest.fn(), end: jest.fn()});

describe('logger.ntfy', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not publish outside production', () => {
    mockedConfigGet.mockImplementation(
      (key: string) => ({env: 'test', 'ntfy.topic': 'errors', 'ntfy.url': 'https://ntfy.sh'})[key],
    );

    logger.ntfy('boom');

    expect(https.request).not.toHaveBeenCalled();
    expect(http.request).not.toHaveBeenCalled();
  });

  it('does not publish when no NTFY_TOPIC is configured', () => {
    mockedConfigGet.mockImplementation(
      (key: string) => ({env: 'production', 'ntfy.topic': '', 'ntfy.url': 'https://ntfy.sh'})[key],
    );

    logger.ntfy('boom');

    expect(https.request).not.toHaveBeenCalled();
  });

  it('publishes to https://ntfy.sh when NTFY_URL is unset', () => {
    mockedConfigGet.mockImplementation(
      (key: string) => ({env: 'production', 'ntfy.topic': 'errors', 'ntfy.url': ''})[key],
    );
    const req = fakeReq();
    (https.request as jest.Mock).mockReturnValue(req);

    logger.ntfy('boom', {title: 'Uh oh', priority: 'high', tags: 'warning'});

    expect(https.request).toHaveBeenCalledWith(
      expect.objectContaining({href: 'https://ntfy.sh/errors'}),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Title: 'Uh oh',
          Priority: 'high',
          Tags: 'warning',
        }),
      }),
    );
    expect(req.write).toHaveBeenCalledWith('boom');
    expect(req.end).toHaveBeenCalled();
  });

  it('uses http for a self-hosted http:// ntfy url', () => {
    mockedConfigGet.mockImplementation(
      (key: string) =>
        ({env: 'production', 'ntfy.topic': 'errors', 'ntfy.url': 'http://ntfy.internal'})[key],
    );
    const req = fakeReq();
    (http.request as jest.Mock).mockReturnValue(req);

    logger.ntfy('boom');

    expect(http.request).toHaveBeenCalled();
    expect(https.request).not.toHaveBeenCalled();
  });
});
