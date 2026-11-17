import { Request, Response } from 'express';

jest.mock('./api_response', () => ({
  sendStatus: jest.fn()
}));
import { sendStatus } from './api_response';
import { createRateLimiter } from './rate_limiter';

describe('RateLimiter', () => {
  const WINDOW_MS = 1000;

  const createRequest = (ip: string) => <Partial<Request>>(<unknown>{
      ip: ip,
      method: 'POST',
      headers: {},
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
  const invoke = (limiter: any, ip: string) => {
    const req = createRequest(ip);
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
    jest.clearAllMocks();
  });

  it('lets requests pass while the limit is not exceeded', async () => {
    const limiter = createRateLimiter(WINDOW_MS, 2);

    const first = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();
    const second = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    expect(first.nextCalled).toBe(true);
    expect(second.nextCalled).toBe(true);
    expect(sendStatus).not.toHaveBeenCalled();
  });

  it('rejects the request exceeding the limit with a 429 and stops the chain', async () => {
    const limiter = createRateLimiter(WINDOW_MS, 2);
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
    const limiter = createRateLimiter(WINDOW_MS, 1);
    invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    const otherClient = invoke(limiter, '5.6.7.8');
    await flushMicrotasks();

    expect(otherClient.nextCalled).toBe(true);
    expect(sendStatus).not.toHaveBeenCalled();
  });

  it('opens a new window after the previous one expired', async () => {
    const limiter = createRateLimiter(WINDOW_MS, 1);
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
    const limiter = createRateLimiter(WINDOW_MS, 1);
    const { res } = invoke(limiter, '1.2.3.4');
    await flushMicrotasks();

    expect(res.setHeader).toHaveBeenCalledWith('RateLimit-Policy', `1;w=${WINDOW_MS / 1000}`);
    expect(res.setHeader).toHaveBeenCalledWith('RateLimit-Limit', '1');
    expect(res.setHeader).toHaveBeenCalledWith('RateLimit-Remaining', '0');
  });
});
