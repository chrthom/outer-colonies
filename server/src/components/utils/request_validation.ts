import { Request, Response } from 'express';
import { z } from 'zod';
import { starterDecks } from '../../shared/config/starter_decks';
import { sendStatus } from './api_response';

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
  .refine(value => /\p{L}/u.test(value) && /\d/.test(value), {
    message: 'Password must contain at least one letter and one digit'
  });

/** Email constraints, mirrored from the registration form and the `varchar(60)` column. */
const email = z
  .string({ message: 'Email must be a string' })
  .trim()
  .max(60, 'Email must not be longer than 60 characters')
  .email('Invalid email address');

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

/** Schema for `POST /api/auth/register` request bodies. */
export const authRegisterSchema = z.object({
  username: username,
  password: strongPassword,
  email: email,
  starterDeck: starterDeck,
  newsletter: z.boolean({ message: 'Newsletter must be a boolean' })
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
 * Validates a request body against a zod schema. On a validation failure a 400 response with
 * the first validation error as message is sent and `undefined` is returned; on success the
 * parsed (and potentially transformed, e.g. trimmed) body is returned.
 * @param schema zod schema the request body must satisfy
 * @param req request whose body is validated
 * @param res response the 400 is sent to on a validation failure
 * @returns the parsed request body, or `undefined` if the body is invalid
 */
export function validateBody<S extends z.ZodType>(
  schema: S,
  req: Request,
  res: Response
): z.output<S> | undefined {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    sendStatus(res, 400, result.error.issues[0]?.message ?? 'Invalid request body');
    return undefined;
  }
  return result.data;
}
