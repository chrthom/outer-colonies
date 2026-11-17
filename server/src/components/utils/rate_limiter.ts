import { rateLimit } from 'express-rate-limit';
import { sendStatus } from './api_response';

/**
 * Creates an IP-based rate limiter for an unauthenticated API endpoint. Requests over the
 * limit are rejected with a 429 `GenericResponse` (consistent with the rest of the API) and
 * the standard `RateLimit-*` headers, so clients can tell when to retry.
 * @param windowMs sliding window in milliseconds over which the requests are counted
 * @param limit maximum number of requests per window and IP
 * @returns the express middleware enforcing the limit
 */
export function createRateLimiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs: windowMs,
    limit: limit,
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    handler: (_req, res) => sendStatus(res, 429, 'Too many requests, please try again later')
  });
}

/**
 * Brute-force protection for login attempts: a fixed window of 15 minutes per IP, generous
 * enough for a user with a few failed attempts, but too slow for credential stuffing.
 */
export const loginRateLimiter = createRateLimiter(15 * 60 * 1000, 10);

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
