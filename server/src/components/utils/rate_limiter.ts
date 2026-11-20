import config from 'config';
import { ipKeyGenerator, rateLimit, ValueDeterminingMiddleware } from 'express-rate-limit';
import { sendStatus } from '../rest_api/api_response';
import { logger } from './logger';

/** Options for {@link createRateLimiter}. */
export interface RateLimiterOptions {
  /** Sliding window in milliseconds over which the requests are counted. */
  windowMs: number;
  /** Maximum number of requests per window and bucket key. */
  limit: number;
  /**
   * Do not count requests the endpoint answered successfully, so normal usage cannot
   * exhaust the limit; only rejected requests consume it.
   */
  skipSuccessfulRequests?: boolean;
  /** Custom bucket key builder; defaults to the client's normalized IP address. */
  keyGenerator?: ValueDeterminingMiddleware<string>;
  /**
   * Override for `rate_limit.dry_run`: when `true`, exceeding the limit logs a warning
   * instead of rejecting the request with 429. Defaults to `config.get('rate_limit.dry_run')`.
   */
  dryRun?: boolean;
}

/**
 * Creates a rate limiter for an API endpoint. Requests over the limit are rejected with a 429
 * `GenericResponse` (consistent with the rest of the API) and the standard `RateLimit-*`
 * headers, so clients can tell when to retry. When `rate_limit.dry_run` is enabled in config,
 * exceeding the limit logs a warning (including `req.ip` so reverse-proxy bucketing can be
 * verified in logs) and lets the request pass instead of blocking it.
 * @param options rate limiter configuration
 * @returns the express middleware enforcing the limit
 */
export function createRateLimiter(options: RateLimiterOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    keyGenerator: options.keyGenerator,
    handler: (req, res, next) => {
      const dryRun = options.dryRun ?? config.get<boolean>('rate_limit.dry_run');
      if (dryRun) {
        const route = req.route?.path;
        const context = `${req.method}${route ? ` ${route}` : ''}`;
        logger.warn(`Rate limit exceeded (dry-run) for ${context} from IP ${req.ip}`);
        next();
        return;
      }
      sendStatus(res, 429, 'Too many requests, please try again later');
    }
  });
}

/**
 * Brute-force protection per account and IP for login attempts: a fixed window of 15 minutes
 * per `(ip, identifier)` pair, so failed attempts on one account do not lock out other users
 * sharing an IP (household, corporate network, CG-NAT). Only failed attempts consume the
 * budget, so legitimate logins cannot exhaust it.
 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: req => {
    const ip = ipKeyGenerator(req.ip ?? '');
    const rawUsername = (req.body as { username?: unknown } | undefined)?.username;
    // Normalized to match the case-insensitive DB lookup and trimmed request schema
    const identifier = typeof rawUsername === 'string' ? rawUsername.trim().toLowerCase() : '';
    return `${ip}:${identifier}`;
  }
});

/**
 * Secondary IP-wide login ceiling against credential stuffing across many distinct usernames
 * from a single IP. Set high enough not to affect households or shared NATs under normal use,
 * and skips successful logins so only failed attempts consume it.
 */
export const loginIpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  skipSuccessfulRequests: true
});

/**
 * Throttles password reset requests: each request sends a mail with a one-time link, so a
 * higher limit would allow flooding arbitrary mailboxes with reset mails.
 */
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10
});

/**
 * Slows down mass user enumeration through the availability check: the register form
 * triggers one request per debounced keystroke, so the limit must not obstruct typing.
 */
export const existsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 60
});

/**
 * Throttles mass account creation, which also floods the activation mail inbox. Kept generous
 * enough for shared IPs (households, events) and valid retries after validation passes.
 */
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 25
});

/**
 * Lax throttle for the session-backed login endpoints (GET and DELETE `/api/auth/login`):
 * every request performs a database session lookup even when it is rejected unauthenticated
 * (401 without a token, 403 for an unknown one), so without a limit the pair would be a
 * cheap denial-of-service surface. 120 requests per minute is far beyond any legitimate
 * session use, which sends a handful of requests per page load at most.
 */
export const sessionLoginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 120
});
