import { rateLimit } from 'express-rate-limit';
import { sendStatus } from '../rest_api/api_response';

/**
 * Creates an IP-based rate limiter for an unauthenticated API endpoint. Requests over the
 * limit are rejected with a 429 `GenericResponse` (consistent with the rest of the API) and
 * the standard `RateLimit-*` headers, so clients can tell when to retry.
 * @param windowMs sliding window in milliseconds over which the requests are counted
 * @param limit maximum number of requests per window and IP
 * @param options further express-rate-limit options layered on top of the shared configuration
 * @returns the express middleware enforcing the limit
 */
export function createRateLimiter(
  windowMs: number,
  limit: number,
  options: { skipSuccessfulRequests?: boolean } = {}
) {
  return rateLimit({
    windowMs: windowMs,
    limit: limit,
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    handler: (_req, res) => sendStatus(res, 429, 'Too many requests, please try again later'),
    ...options
  });
}

/**
 * Brute-force protection for login attempts: a fixed window of 15 minutes per IP, generous
 * enough for a user with a few failed attempts, but too slow for credential stuffing.
 * Successful logins do not count towards the limit, so users sharing an IP (household, NAT)
 * cannot be locked out of login by legitimate use.
 */
export const loginRateLimiter = createRateLimiter(15 * 60 * 1000, 10, {
  skipSuccessfulRequests: true
});

/**
 * Lax throttle for the session-resolving login endpoints: each request carrying a session
 * token performs a database lookup, so unthrottled probing is a cheap database load. The
 * limit sits far above normal session usage (one lookup per login, logout or session
 * check) and only caps scripted abuse.
 */
export const sessionRateLimiter = createRateLimiter(60 * 1000, 120);

/**
 * Throttles password reset requests: each request sends a mail with a one-time link, so a
 * higher limit would allow flooding arbitrary mailboxes with reset mails.
 */
export const passwordResetRateLimiter = createRateLimiter(60 * 60 * 1000, 5);

/**
 * Slows down mass user enumeration through the availability check: the register form
 * triggers one request per debounced keystroke, so the limit must not obstruct typing.
 */
export const existsRateLimiter = createRateLimiter(60 * 1000, 60);

/** Throttles mass account creation, which also floods the activation mail inbox. */
export const registerRateLimiter = createRateLimiter(60 * 60 * 1000, 10);
