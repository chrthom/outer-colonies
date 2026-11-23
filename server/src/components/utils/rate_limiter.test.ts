import config from 'config';
import { Request, Response } from 'express';

jest.mock('../rest_api/api_response', () => ({
  sendStatus: jest.fn()
}));
import { sendStatus } from '../rest_api/api_response';
import { logger } from './logger';
import { createRateLimiter } from './rate_limiter';

describe('RateLimiter', () => {
  const WINDOW_MS = 1000;

  const createRequest = (ip: string, body?: Record<string, unknown>) => <Partial<Request>>(<unknown>{
      ip: ip,
      method: 'POST',
      headers: {},
      body: body,
      app: { get: () => 'loopback' },
      route: { path: '/api/test' }
    });
  const createResponse = (req: Partial<Request>) => {
    const res: any = { req: req, headersSent: false, setHeader: jest.fn() };
    res.status = jest.fn().mockReturnThis();
    res.send = jest.fn();
    return <Response>(<unknown>res);
  };
  // The rate limiter middleware resolves asynchronously, so the nextCalled flag must be
  // read through a getter instead of a captured (stale) boolean value
  const invoke = (limiter: any, ip: string, body?: Record<string, unknown>) => {
    const req = createRequest(ip, body);
    const res = createResponse(req);
    let nextCalled = false;
    limiter(req, res, () => (nextCalled = true));
    return {
      res,
      get nextCalled() {
        return nextCalled;
      }
    };
  };
  const flushMicrotasks = () => new Promise(resolve => setImmediate(resolve));

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('lets requests pass while the limit is not exceeded', async () => {
    const limiter = createRateLimiter({ windowMs: WINDOW_MS, limit: 2 });

    const first = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();
    const second = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    expect(first.nextCalled).toBe(true);
    expect(second.nextCalled).toBe(true);
    expect(sendStatus).not.toHaveBeenCalled();
  });

  it('rejects the request exceeding the limit with a 429 and stops the chain', async () => {
    const limiter = createRateLimiter({ windowMs: WINDOW_MS, limit: 2 });
    invoke(limiter, '1.2.3.4');
    await flushMicrotasks();
    invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    const third = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    expect(third.nextCalled).toBe(false);
    expect(sendStatus).toHaveBeenCalledWith(third.res, 429, 'Too many requests, please try again later');
  });

  it('logs a warning and lets the request pass in dry-run mode', async () => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const limiter = createRateLimiter({ windowMs: WINDOW_MS, limit: 1, dryRun: true });
    invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    const second = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    expect(second.nextCalled).toBe(true);
    expect(sendStatus).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Rate limit exceeded (dry-run) for POST /api/test from IP 1.2.3.4');
  });

  it('reads rate_limit.dry_run from config when no override is passed', async () => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    jest.spyOn(config, 'get').mockReturnValue(true);
    const limiter = createRateLimiter({ windowMs: WINDOW_MS, limit: 1 });
    invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    const second = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    expect(second.nextCalled).toBe(true);
    expect(sendStatus).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Rate limit exceeded (dry-run) for POST /api/test from IP 1.2.3.4');
  });

  it('sets the standard rate limit headers on every response', async () => {
    const limiter = createRateLimiter({ windowMs: WINDOW_MS, limit: 1 });
    const { res } = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    expect(res.setHeader).toHaveBeenCalledWith('RateLimit-Policy', `1;w=${WINDOW_MS / 1000}`);
    expect(res.setHeader).toHaveBeenCalledWith('RateLimit-Limit', '1');
    expect(res.setHeader).toHaveBeenCalledWith('RateLimit-Remaining', '0');
  });
});
