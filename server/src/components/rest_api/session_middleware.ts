import { NextFunction, Request, Response } from 'express';
import { APIRejectReason } from '../../shared/config/enums';
import DBCredentialsDAO, { DBCredentialWithSessionToken } from '../persistence/db_credentials';
import { ApiError, toApiError } from './api_error';

/**
 * Session authentication middleware: resolves the `session-token` header to the matching
 * credential record and stores it on the response locals for the handler. Unauthenticated
 * requests are rejected centrally (401 without a token, 403 for an unknown or expired token),
 * so an endpoint behind this middleware cannot forget its authentication check.
 */
export function requireSession(req: Request, res: Response, next: NextFunction): void {
  const sessionToken = req.header('session-token');
  if (!sessionToken) {
    next(new ApiError(401, 'No session-token header provided'));
    return;
  }
  DBCredentialsDAO.getBySessionToken(sessionToken).then(
    credentials => {
      res.locals['credentials'] = credentials;
      next();
    },
    reason => next(toApiError(reason, { [APIRejectReason.NotFound]: [403] }))
  );
}

/**
 * Returns the session credentials resolved by {@link requireSession} for the current request.
 * @param res response of the authenticated request
 * @returns credentials of the session's user
 */
export function sessionCredentials(res: Response): DBCredentialWithSessionToken {
  return res.locals['credentials'];
}
