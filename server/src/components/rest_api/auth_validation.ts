import { Router } from 'express';
import {
  authEmailSchema,
  authExistsQuerySchema,
  authLoginSchema,
  authPasswordResetUserSchema,
  authPasswordSchema,
  authRegisterSchema,
  oneTimeIdSchema,
  validateBodyMiddleware,
  validateParamsMiddleware,
  validateQueryMiddleware
} from '../utils/request_validation';
import {
  existsRateLimiter,
  loginIpRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  registerRateLimiter,
  sessionLoginRateLimiter
} from '../utils/rate_limiter';

/**
 * Express router guarding the auth endpoints of the resource routers: mounted in front of
 * them (see `app.ts`), it validates request bodies, query strings and path parameters with
 * zod schemas - so oversized or malformed values are rejected with a 400 before any session,
 * database or mail access happens downstream - and rate-limits the unauthenticated endpoints
 * against brute force, mail flooding, user enumeration and mass account creation.
 */
const authValidation = Router();

authValidation.post('/api/auth/register', validateBodyMiddleware(authRegisterSchema), registerRateLimiter);

authValidation.put('/api/auth/register/:id', validateParamsMiddleware(oneTimeIdSchema));

authValidation.post(
  '/api/auth/login',
  loginIpRateLimiter,
  loginRateLimiter,
  validateBodyMiddleware(authLoginSchema)
);

authValidation.get('/api/auth/login', sessionLoginRateLimiter);

authValidation.delete('/api/auth/login', sessionLoginRateLimiter);

authValidation.get('/api/auth/exists', existsRateLimiter, validateQueryMiddleware(authExistsQuerySchema));

authValidation.delete(
  '/api/auth/password/:user',
  validateParamsMiddleware(authPasswordResetUserSchema),
  passwordResetRateLimiter
);

authValidation.put('/api/auth/password', validateBodyMiddleware(authPasswordSchema));

authValidation.put(
  '/api/auth/password/:id',
  validateBodyMiddleware(authPasswordSchema),
  validateParamsMiddleware(oneTimeIdSchema)
);

authValidation.post('/api/auth/email', validateBodyMiddleware(authEmailSchema));

authValidation.put('/api/auth/email/:id', validateParamsMiddleware(oneTimeIdSchema));

export default authValidation;
