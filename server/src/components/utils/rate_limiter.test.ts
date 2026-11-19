import config from 'config';
import { Request, Response } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import { EventEmitter } from 'node:events';

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

  it('tracks the limits of different IPs independently', async () => {
    const limiter = createRateLimiter({ windowMs: WINDOW_MS, limit: 1 });
    invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    const otherClient = invoke(limiter, '5.6.7.8');
    await flushMicrotasks();

    expect(otherClient.nextCalled).toBe(true);
    expect(sendStatus).not.toHaveBeenCalled();
  });

  it('tracks custom keyGenerator buckets independently on the same IP', async () => {
    const limiter = createRateLimiter({
      windowMs: WINDOW_MS,
      limit: 1,
      keyGenerator: req => `${ipKeyGenerator(req.ip ?? '')}:${req.body?.username ?? ''}`
    });
    invoke(limiter, '1.2.3.4', { username: 'alice' });
    await flushMicrotasks();

    const blockedSameUser = invoke(limiter, '1.2.3.4', { username: 'alice' });
    await flushMicrotasks();
    const otherUserSameIp = invoke(limiter, '1.2.3.4', { username: 'bob' });
    await flushMicrotasks();

    expect(blockedSameUser.nextCalled).toBe(false);
    expect(otherUserSameIp.nextCalled).toBe(true);
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

  it('does not count successful responses toward the limit when successful requests are skipped', async () => {
    const limiter = createRateLimiter({ windowMs: WINDOW_MS, limit: 1, skipSuccessfulRequests: true });
    // A response the library can observe: it resolves the successful-request detection via
    // the finish event, so the response mock must be an event emitter whose send() finishes
    // the response like express does
    const invokeAndFinishSuccessfully = (limiter: any, ip: string) => {
      const req = createRequest(ip);
      const res: any = new EventEmitter();
      res.req = req;
      res.statusCode = 200;
      res.headersSent = false;
      res.setHeader = jest.fn();
      res.status = jest.fn().mockImplementation((code: number) => {
        res.statusCode = code;
        return res;
      });
      res.send = jest.fn().mockImplementation(() => res.emit('finish'));
      let nextCalled = false;
      limiter(req, res, () => (nextCalled = true));
      return {
        respondSuccessfully: () => res.status(200).send(),
        get nextCalled() {
          return nextCalled;
        }
      };
    };

    const first = invokeAndFinishSuccessfully(limiter, '1.2.3.4');
    await flushMicrotasks();
    first.respondSuccessfully();
    await flushMicrotasks();
    expect(first.nextCalled).toBe(true);

    const second = invokeAndFinishSuccessfully(limiter, '1.2.3.4');
    await flushMicrotasks();

    expect(second.nextCalled).toBe(true);
    expect(sendStatus).not.toHaveBeenCalled();
  });

  it('opens a new window after the previous one expired', async () => {
    const limiter = createRateLimiter({ windowMs: WINDOW_MS, limit: 1 });
    invoke(limiter, '1.2.3.4');
    await flushMicrotasks();
    const blocked = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();
    expect(blocked.nextCalled).toBe(false);

    await new Promise(resolve => setTimeout(resolve, WINDOW_MS + 10));
    const afterWindow = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    expect(afterWindow.nextCalled).toBe(true);
    expect(sendStatus).toHaveBeenCalledTimes(1);
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
