import { starterDecks } from '../../shared/config/starter_decks';
import {
  authEmailSchema,
  authLoginSchema,
  authPasswordSchema,
  authRegisterSchema,
  validateBody
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
      ['non-boolean newsletter', { newsletter: 'yes' }],
      ['missing newsletter', { newsletter: undefined }]
    ])('rejects a registration body with a %s', (_case, invalidChange) => {
      const result = authRegisterSchema.safeParse({ ...validBody, ...invalidChange });
      expect(result.success).toBe(false);
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

  describe('validateBody', () => {
    const createRequest = (body: unknown) => <{ body: unknown; method: string; route: { path: string } }>(<
        unknown
      >{
        body: body,
        method: 'POST',
        route: { path: '/api/test' }
      });
    const createResponse = (req: object) => {
      const res: any = { req: req };
      res.status = jest.fn().mockReturnThis();
      res.send = jest.fn();
      return res;
    };

    it('returns the parsed body and sends no response for a valid body', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const req = createRequest({ email: '  test@example.com  ' });
      const res = createResponse(req);

      const parsed = validateBody(authEmailSchema, <any>req, <any>res);

      expect(parsed?.email).toBe('test@example.com');
      expect(res.status).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('sends a 400 with the first validation error and returns undefined for an invalid body', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const req = createRequest({ email: 'not-an-email' });
      const res = createResponse(req);

      const parsed = validateBody(authEmailSchema, <any>req, <any>res);

      expect(parsed).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ status: 400, message: 'Invalid email address' });
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^WARN: .*status 400/));
    });

    it('sends a 400 for a missing body', () => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const req = createRequest(undefined);
      const res = createResponse(req);

      expect(validateBody(authEmailSchema, <any>req, <any>res)).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
