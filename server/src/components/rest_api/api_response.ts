import { Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { GenericResponse } from '../../shared/interfaces/rest_api';

/**
 * Sends a status response and logs error statuses with a level beforehand, so no API failure
 * degrades silently: 4xx are logged as `WARN` (recoverable, e.g. invalid client requests) and
 * 5xx as `ERROR` (server-side failures that need attention). Only the method and the matched
 * route pattern are logged - never the query string or the concrete path, whose parameters
 * may carry credentials, email addresses or one-time UUIDs.
 * @param res response to send the status to
 * @param status HTTP status code
 * @param message optional response message, defaults to the standard status text
 */
export function sendStatus(res: Response, status: number, message?: string): void {
  if (status >= 400) {
    const level = status >= 500 ? 'ERROR' : 'WARN';
    // The matched route pattern is logged instead of the concrete path: path parameters can
    // carry usernames, email addresses or one-time UUIDs, which must never end up in logs
    const route = res.req?.route?.path;
    const context = res.req ? ` for ${res.req.method}${route ? ` ${route}` : ''}` : '';
    console.log(`${level}: API request${context} failed with status ${status}`);
  }
  const r: GenericResponse = {
    status: status,
    message: message ?? STATUS_CODES[status]
  };
  res.status(status).send(r);
}
