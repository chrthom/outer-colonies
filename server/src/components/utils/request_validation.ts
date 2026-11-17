import { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { starterDecks } from '../../shared/config/starter_decks';
import { passwordHasLetterAndDigit } from '../../shared/config/password_rules';
import { sendStatus } from '../rest_api/api_response';

/**
 * Username constraints, mirrored from the registration form in the website and the
 * `varchar(20)` column of the credentials table.
 */
const username = z
  .string({ message: 'Username must be a string' })
  .trim()
  .min(3, 'Username must be between 3 and 20 characters long')
  .max(20, 'Username must be between 3 and 20 characters long');

/**
 * Password strength rule for newly set passwords: 8 to 40 characters (the length also
 * enforced by the website forms and the `varchar(40)` column) plus at least one letter and
 * one digit. Not applied to login, where existing passwords must keep working.
 */
const strongPassword = z
  .string({ message: 'Password must be a string' })
  .min(8, 'Password must be between 8 and 40 characters long')
  .max(40, 'Password must be between 8 and 40 characters long')
  .refine(value => passwordHasLetterAndDigit(value), {
    message: 'Password must contain at least one letter and one digit'
  });

/**
 * Email constraints, mirrored from the registration form and the `varchar(60)` column. The
 * value is trimmed and length-checked before the format check runs (via `pipe`), because the
 * top-level `z.email()` format would otherwise reject padded input before trimming it.
 */
const email = z
  .string({ message: 'Email must be a string' })
  .trim()
  .max(60, 'Email must not be longer than 60 characters')
  .pipe(z.email('Invalid email address'));

/**
 * Starter deck index: the website sends the selected index as a number, but the select
 * options of older deployed versions carried numeric strings, so both are accepted.
 */
const starterDeck = z
  .union([z.number(), z.string()], { message: 'Invalid starter deck' })
  .refine(value => typeof value == 'number' || /^-?\d+$/.test(value), 'Invalid starter deck')
  .transform(Number)
  .refine(
    value => Number.isInteger(value) && value >= 0 && value < starterDecks.length,
    'Invalid starter deck'
  );

/**
 * Schema for `POST /api/auth/register` request bodies. The newsletter defaults to false, so
 * older deployed clients whose register payloads predate the field keep working.
 */
export const authRegisterSchema = z.object({
  username: username,
  password: strongPassword,
  email: email,
  starterDeck: starterDeck,
  newsletter: z.boolean({ message: 'Newsletter must be a boolean' }).default(false)
});

/**
 * Schema for `POST /api/auth/login` request bodies. The identifier may be a username or an
 * email address, and the password is only checked for presence and size - not against the
 * strength rule - so accounts with legacy passwords can still log in.
 */
export const authLoginSchema = z.object({
  username: z
    .string({ message: 'Username must be a string' })
    .trim()
    .min(1, 'Username or email is required')
    .max(60, 'Username or email must not be longer than 60 characters'),
  password: z
    .string({ message: 'Password must be a string' })
    .min(1, 'Password is required')
    .max(40, 'Password must not be longer than 40 characters')
});

/** Schema for the password change endpoints (`PUT /api/auth/password*`). */
export const authPasswordSchema = z.object({
  password: strongPassword
});

/** Schema for `POST /api/auth/email` request bodies. */
export const authEmailSchema = z.object({
  email: email
});

/**
 * Schema for the query params of `GET /api/auth/exists`: at most one of `username` or
 * `email` is checked per request, so both are optional here and the endpoint rejects a
 * query carrying neither.
 */
export const authExistsQuerySchema = z.object({
  username: username.optional(),
  email: email.optional()
});

/**
 * Schema for the `:user` path param of `DELETE /api/auth/password/:user`: the account to
 * send the password reset mail for is identified by its username or its email address.
 */
export const authPasswordResetUserSchema = z.object({
  user: z.union([username, email], { message: 'User must be a username or an email address' })
});

/**
 * Schema for the one-time link id path params (`PUT /api/auth/register/:id`,
 * `PUT /api/auth/password/:id`, `PUT /api/auth/email/:id`): the ids are UUIDs, so bounding
 * the format keeps oversized or malformed values out of the database lookup.
 */
export const oneTimeIdSchema = z.object({
  id: z.uuid('Invalid one-time link id')
});

// Sends the 400 response for a failed validation and returns undefined, so callers can bail
// out with a bare falsy check; on success the parsed (and potentially transformed, e.g.
// trimmed) value is returned.
function validate<S extends z.ZodType>(
  schema: S,
  value: unknown,
  res: Response,
  fallbackMessage: string
): z.output<S> | undefined {
  const result = schema.safeParse(value);
  if (!result.success) {
    sendStatus(res, 400, result.error.issues[0]?.message ?? fallbackMessage);
    return undefined;
  }
  return result.data;
}

// Builds the express middleware variant of a validation: on success the parsed value replaces
// the request property (so downstream handlers operate on validated data) and the chain
// continues; on a validation failure the 400 short-circuits the request before it reaches the
// guarded route.
function validationMiddleware<S extends z.ZodType>(
  schema: S,
  read: (req: Request) => unknown,
  write: (req: Request, parsed: z.output<S>) => void,
  fallbackMessage: string
): RequestHandler {
  return (req, res, next) => {
    const parsed = validate(schema, read(req), res, fallbackMessage);
    if (parsed === undefined) return;
    write(req, parsed);
    next();
  };
}

/**
 * Validates the request body against a zod schema as express middleware: the parsed body
 * replaces `req.body`, so the guarded handler operates on validated (and potentially
 * transformed, e.g. trimmed) data.
 * @param schema zod schema the request body must satisfy
 * @returns the express middleware enforcing the schema
 */
export function validateBodyMiddleware<S extends z.ZodType>(schema: S): RequestHandler {
  return validationMiddleware(
    schema,
    req => req.body,
    (req, parsed) => {
      req.body = parsed;
    },
    'Invalid request body'
  );
}

/**
 * Validates the query parameters of a request against a zod schema as express middleware:
 * the parsed parameters replace `req.query` wholesale - keys dropped by the schema are
 * removed instead of lingering on in unvalidated form - so the guarded handler reads
 * validated (and potentially transformed, e.g. trimmed) values.
 * @param schema zod schema the query parameters must satisfy
 * @returns the express middleware enforcing the schema
 */
export function validateQueryMiddleware<S extends z.ZodType>(schema: S): RequestHandler {
  return validationMiddleware(
    schema,
    req => req.query,
    (req, parsed) => {
      for (const key of Object.keys(req.query)) delete req.query[key];
      Object.assign(req.query, parsed);
    },
    'Invalid query parameters'
  );
}

/**
 * Validates the path parameters of a request against a zod schema as express middleware:
 * the parsed parameters are assigned back onto `req.params`. Express re-derives path
 * parameters from the URL for every matched route, so the assignment serves this stack;
 * the schema's lasting effect downstream is the 400 gate for malformed values.
 * @param schema zod schema the path parameters must satisfy
 * @returns the express middleware enforcing the schema
 */
export function validateParamsMiddleware<S extends z.ZodType>(schema: S): RequestHandler {
  return validationMiddleware(
    schema,
    req => req.params,
    (req, parsed) => {
      Object.assign(req.params, parsed);
    },
    'Invalid path parameters'
  );
}
