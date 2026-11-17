import { RequestHandler } from 'express';
import { starterDecks } from '../../shared/config/starter_decks';
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
} from './request_validation';

describe('RequestValidation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authRegisterSchema', () => {
    const validBody = {
      username: 'testuser',
      password: 'password1',
      email: 'test@example.com',
      starterDeck: 0,
      newsletter: false
    };

    it('accepts a valid registration body', () => {
      const result = authRegisterSchema.safeParse(validBody);
      expect(result.success).toBe(true);
    });

    it('trims username and email and accepts numeric strings as starter deck', () => {
      const result = authRegisterSchema.safeParse({
        ...validBody,
        username: '  testuser  ',
        email: '  test@example.com  ',
        starterDeck: '1'
      });
      expect(result.success && result.data.username).toBe('testuser');
      expect(result.success && result.data.email).toBe('test@example.com');
      expect(result.success && result.data.starterDeck).toBe(1);
    });

    it.each([
      ['starter deck index out of range', { starterDeck: starterDecks.length }],
      ['negative starter deck index', { starterDeck: -1 }],
      ['non-numeric starter deck', { starterDeck: 'first' }],
      ['empty starter deck', { starterDeck: '' }],
      ['fractional starter deck', { starterDeck: 1.5 }],
      ['missing starter deck', { starterDeck: undefined }],
      ['short username', { username: 'ab' }],
      ['long username', { username: 'a'.repeat(21) }],
      ['missing username', { username: undefined }],
      ['password without a digit', { password: 'password' }],
      ['password without a letter', { password: '12345678' }],
      ['short password', { password: 'ab1' }],
      ['long password', { password: 'a1'.repeat(21) }],
      ['missing password', { password: undefined }],
      ['malformed email', { email: 'not-an-email' }],
      ['long email', { email: `${'a'.repeat(50)}@example.com` }],
      ['missing email', { email: undefined }],
      ['non-boolean newsletter', { newsletter: 'yes' }]
    ])('rejects a registration body with a %s', (_case, invalidChange) => {
      const result = authRegisterSchema.safeParse({ ...validBody, ...invalidChange });
      expect(result.success).toBe(false);
    });

    it('defaults a missing newsletter to false for older clients', () => {
      const result = authRegisterSchema.safeParse({ ...validBody, newsletter: undefined });
      expect(result.success && result.data.newsletter).toBe(false);
    });
  });

  describe('authLoginSchema', () => {
    it('accepts a username', () => {
      expect(authLoginSchema.safeParse({ username: 'testuser', password: 'password1' }).success).toBe(true);
    });

    it('accepts an email address as identifier', () => {
      expect(authLoginSchema.safeParse({ username: 'test@example.com', password: 'password1' }).success).toBe(
        true
      );
    });

    it.each([
      ['missing username', { username: undefined }],
      ['empty username', { username: '' }],
      ['long username', { username: 'a'.repeat(61) }],
      ['missing password', { password: undefined }],
      ['empty password', { password: '' }],
      ['long password', { password: 'a'.repeat(41) }]
    ])('rejects a login body with a %s', (_case, invalidChange) => {
      const result = authLoginSchema.safeParse({
        username: 'testuser',
        password: 'password1',
        ...invalidChange
      });
      expect(result.success).toBe(false);
    });
  });

  describe('authPasswordSchema', () => {
    const validBody = { password: 'password1' };

    it('accepts a strong password', () => {
      expect(authPasswordSchema.safeParse(validBody).success).toBe(true);
    });

    it.each([
      ['password without a digit', { password: 'password' }],
      ['password without a letter', { password: '12345678' }],
      ['short password', { password: 'ab1' }],
      ['missing password', { password: undefined }]
    ])('rejects a %s', (_case, invalidChange) => {
      const result = authPasswordSchema.safeParse({ ...validBody, ...invalidChange });
      expect(result.success).toBe(false);
    });
  });

  describe('authEmailSchema', () => {
    const validBody = { email: 'test@example.com' };

    it('accepts a valid email address', () => {
      expect(authEmailSchema.safeParse(validBody).success).toBe(true);
    });

    it.each([
      ['malformed email', { email: 'not-an-email' }],
      ['missing email', { email: undefined }],
      ['non-string email', { email: 42 }]
    ])('rejects a %s', (_case, invalidChange) => {
      const result = authEmailSchema.safeParse({ ...validBody, ...invalidChange });
      expect(result.success).toBe(false);
    });
  });

  describe('authExistsQuerySchema', () => {
    it('accepts a username', () => {
      expect(authExistsQuerySchema.safeParse({ username: 'testuser' }).success).toBe(true);
    });

    it('accepts an email address', () => {
      expect(authExistsQuerySchema.safeParse({ email: 'test@example.com' }).success).toBe(true);
    });

    it('accepts a query with neither username nor email', () => {
      expect(authExistsQuerySchema.safeParse({}).success).toBe(true);
    });

    it.each([
      ['short username', { username: 'ab' }],
      ['long username', { username: 'a'.repeat(21) }],
      ['malformed email', { email: 'not-an-email' }],
      ['long email', { email: `${'a'.repeat(50)}@example.com` }]
    ])('rejects a query with a %s', (_case, invalidQuery) => {
      expect(authExistsQuerySchema.safeParse(invalidQuery).success).toBe(false);
    });
  });

  describe('authPasswordResetUserSchema', () => {
    it('accepts a username', () => {
      expect(authPasswordResetUserSchema.safeParse({ user: 'testuser' }).success).toBe(true);
    });

    it('accepts an email address', () => {
      expect(authPasswordResetUserSchema.safeParse({ user: 'test@example.com' }).success).toBe(true);
    });

    it.each([
      ['short user', 'ab'],
      ['junk user beyond the username length', 'a'.repeat(21)],
      ['long user', 'a'.repeat(61)]
    ])('rejects a %s', (_case, invalidUser) => {
      expect(authPasswordResetUserSchema.safeParse({ user: invalidUser }).success).toBe(false);
    });
  });

  describe('oneTimeIdSchema', () => {
    it('accepts a UUID', () => {
      expect(oneTimeIdSchema.safeParse({ id: 'a1b2c3d4-e5f6-4a1b-8c2d-0123456789ab' }).success).toBe(true);
    });

    it.each([
      ['missing id', undefined],
      ['non-UUID id', 'not-a-uuid'],
      ['oversized id', 'a'.repeat(37)]
    ])('rejects a %s', (_case, invalidId) => {
      expect(oneTimeIdSchema.safeParse({ id: invalidId }).success).toBe(false);
    });
  });

  describe('validation middleware', () => {
    const createRequest = (property: 'body' | 'query' | 'params', value: unknown) =>
      <any>{
        body: undefined,
        query: {},
        params: {},
        method: 'POST',
        route: { path: '/api/test' },
        [property]: value
      };
    const invoke = (middleware: RequestHandler, req: any) => {
      const res: any = { req: req };
      res.status = jest.fn().mockReturnThis();
      res.send = jest.fn();
      let nextCalled = false;
      middleware(req, res, () => (nextCalled = true));
      return {
        res,
        get nextCalled() {
          return nextCalled;
        }
      };
    };

    it('parses the body, replaces it on the request and continues the chain', () => {
      const req = createRequest('body', { email: '  test@example.com  ' });

      const result = invoke(validateBodyMiddleware(authEmailSchema), req);

      expect(result.nextCalled).toBe(true);
      expect(req.body).toEqual({ email: 'test@example.com' });
      expect(result.res.status).not.toHaveBeenCalled();
    });

    it('sends a 400 and stops the chain for an invalid body', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const req = createRequest('body', { email: 'not-an-email' });

      const result = invoke(validateBodyMiddleware(authEmailSchema), req);

      expect(result.nextCalled).toBe(false);
      expect(result.res.status).toHaveBeenCalledWith(400);
      expect(result.res.send).toHaveBeenCalledWith({ status: 400, message: 'Invalid email address' });
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/^WARN: .*status 400/));
    });

    it('replaces the query wholesale, dropping keys the schema removed', () => {
      const req = createRequest('query', { username: ' testuser ', extra: 'junk' });

      const result = invoke(validateQueryMiddleware(authExistsQuerySchema), req);

      expect(result.nextCalled).toBe(true);
      expect(req.query).toEqual({ username: 'testuser' });
    });

    it('assigns the parsed path parameters back onto the request', () => {
      const req = createRequest('params', { id: 'a1b2c3d4-e5f6-4a1b-8c2d-0123456789ab' });

      const result = invoke(validateParamsMiddleware(oneTimeIdSchema), req);

      expect(result.nextCalled).toBe(true);
      expect(req.params['id']).toBe('a1b2c3d4-e5f6-4a1b-8c2d-0123456789ab');
    });
  });
});
