import { NextFunction, Request, Response } from 'express';
import { APIRejectReason } from '../../shared/config/enums';
import { sendStatus } from './api_response';

/**
 * Maps a rejection reason of the persistence layer to the HTTP status (and optional message) the
 * API responds with, so each endpoint declares its error contract in one place instead of
 * repeating `reason == X ? code : 500` chains in every handler.
 */
export type RejectMapping = Partial<Record<APIRejectReason, [status: number, message?: string]>>;

/** Typed API failure: carried to the central error-handling middleware, which sends it as response. */
export class ApiError extends Error {
  /** HTTP status code to respond with. */
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Converts a rejection reason into an `ApiError`: `ApiError`s pass through unchanged, persistence
 * reject reasons are translated via the given mapping and everything else becomes an internal
 * server error.
 * @param reason rejection reason of a failed operation
 * @param rejectMapping error contract of the endpoint the rejection occurred in
 * @returns the typed error to hand over to the error-handling middleware
 */
export function toApiError(reason: unknown, rejectMapping: RejectMapping): ApiError {
  if (reason instanceof ApiError) return reason;
  const mapped = rejectMapping[reason as APIRejectReason];
  return mapped ? new ApiError(mapped[0], mapped[1]) : new ApiError(500);
}

/**
 * The single async error-handling wrapper for all route handlers: rejections of the wrapped
 * handler (including those of the persistence layer) are converted into `ApiError`s and forwarded
 * to the central error-handling middleware, so no endpoint can forget its error handling.
 * @param handler async route handler; rejections are handled centrally
 * @param rejectMapping error contract mapping persistence reject reasons to HTTP statuses
 * @returns an express-compatible route handler
 */
export function asyncRoute(
  handler: (req: Request, res: Response) => Promise<void>,
  rejectMapping: RejectMapping = {}
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    handler(req, res).catch(reason => next(toApiError(reason, rejectMapping)));
  };
}

/**
 * Central error-handling middleware of the REST API: every `ApiError` (and every unknown error,
 * which degrades to an internal server error) is answered with its status and the standard
 * `GenericResponse` body, including the leveled failure log (see `sendStatus`).
 */
export function apiErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    // The response is already on the wire: delegate to express, which terminates the connection
    next(err);
    return;
  }
  const apiError = err instanceof ApiError ? err : new ApiError(500);
  // An ApiError without a custom message has the Error default '' - let sendStatus fill in the
  // standard status text instead
  sendStatus(res, apiError.status, apiError.message || undefined);
}
