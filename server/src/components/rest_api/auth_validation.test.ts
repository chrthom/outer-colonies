import config from 'config';
import express from 'express';
import http, { IncomingMessage, RequestOptions } from 'node:http';
import restAPI from './index';
import authValidation from './auth_validation';
import Auth from '../utils/auth';
import { logger } from '../utils/logger';
import { APIRejectReason } from '../../shared/config/enums';

/**
 * Integration harness for the validation and rate-limiting layer in front of the auth
 * endpoints: builds the real express app exactly like `app.ts` does - with the auth
 * validation router mounted in front of the resource routers - and answers requests over
 * local HTTP. The test server receives every request from the loopback address, so trusting
 * the loopback lets each test vary the client IP (and thereby the rate limiter buckets)
 * through the `X-Forwarded-For` header, like the reverse proxy does in production.
 */
describe('REST API auth validation', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(done => {
    const app = express();
    app.set('trust proxy', 'loopback');
    app.use(express.json());
    app.use(authValidation);
    restAPI(app);
    server = http.createServer(app).listen(0, () => {
      const address = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${address.port}`;
      done();
    });
  });

  afterAll(done => {
    server.close(done);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  interface TestResponse {
    status: number;
    body: any;
  }

  /**
   * Sends a request against the test server and resolves status code and parsed body.
   * @param method HTTP method
   * @param path request path (with concrete ids and query string)
   * @param ip client IP to attribute the request to (`X-Forwarded-For`)
   * @param body optional JSON request body
   * @returns the responded status code and body
   */
  function request(method: string, path: string, ip: string, body?: object): Promise<TestResponse> {
    const options: RequestOptions = {
      method,
      agent: false,
      headers: { 'X-Forwarded-For': ip }
    };
    const payload = body === undefined ? undefined : JSON.stringify(body);
    if (payload !== undefined) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
    }
    return new Promise((resolve, reject) => {
      const req = http.request(`${baseUrl}${path}`, options, (res: IncomingMessage) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: data ? JSON.parse(data) : undefined });
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on('error', reject);
      if (payload !== undefined) req.write(payload);
      req.end();
    });
  }

  const validRegisterBody = {
    username: 'testuser',
    password: 'password1',
    email: 'test@example.com',
    starterDeck: 1,
    newsletter: false
  };
  const validOneTimeId = 'a1b2c3d4-e5f6-4a1b-8c2d-0123456789ab';

  describe('request body validation', () => {
    it.each([
      ['starter deck out of range', { starterDeck: 99 }, '192.168.1.11'],
      ['weak password', { password: 'password' }, '192.168.1.12'],
      ['malformed email', { email: 'not-an-email' }, '192.168.1.13'],
      ['short username', { username: 'ab' }, '192.168.1.14'],
      ['non-boolean newsletter', { newsletter: 'yes' }, '192.168.1.15']
    ])(
      'should reject a registration with a %s without touching the database',
      async (_case, invalidBody, ip) => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const checkUsernameExistsSpy = jest.spyOn(Auth, 'checkUsernameExists');

        const response = await request('POST', '/api/auth/register', ip, {
          ...validRegisterBody,
          ...invalidBody
        });

        expect(response.status).toBe(400);
        expect(checkUsernameExistsSpy).not.toHaveBeenCalled();
      }
    );

    it('should register with the parsed body and respond with the user id', async () => {
      jest.spyOn(Auth, 'checkUsernameExists').mockResolvedValue(false);
      jest.spyOn(Auth, 'checkEmailExists').mockResolvedValue(false);
      const registerSpy = jest.spyOn(Auth, 'register').mockResolvedValue(<any>{
        userId: 42,
        username: 'testuser',
        email: 'test@example.com'
      });

      const response = await request('POST', '/api/auth/register', '192.168.1.2', {
        ...validRegisterBody,
        username: '  testuser  ',
        starterDeck: '1'
      });

      expect(registerSpy).toHaveBeenCalledWith({ ...validRegisterBody, starterDeck: 1 });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 42, username: 'testuser' });
    });

    it('should reject a login with an invalid body without an authentication attempt', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const loginSpy = jest.spyOn(Auth, 'login');

      const response = await request('POST', '/api/auth/login', '192.168.2.1', {
        username: 'testuser',
        password: ''
      });

      expect(response.status).toBe(400);
      expect(loginSpy).not.toHaveBeenCalled();
    });

    it('should reject a password reset with a weak password', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const resetPasswordSpy = jest.spyOn(Auth, 'resetPassword');

      const response = await request('PUT', `/api/auth/password/${validOneTimeId}`, '192.168.3.1', {
        password: 'password'
      });

      expect(response.status).toBe(400);
      expect(resetPasswordSpy).not.toHaveBeenCalled();
    });

    it('should reset the password with a strong password', async () => {
      const resetPasswordSpy = jest.spyOn(Auth, 'resetPassword').mockResolvedValue(undefined);

      const response = await request('PUT', `/api/auth/password/${validOneTimeId}`, '192.168.3.2', {
        password: 'password1'
      });

      expect(resetPasswordSpy).toHaveBeenCalledWith(validOneTimeId, 'password1');
      expect(response.status).toBe(204);
    });
  });

  describe('request parameter validation', () => {
    it('should reject an exists check with an invalid username without touching the database', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const checkUsernameExistsSpy = jest.spyOn(Auth, 'checkUsernameExists');

      const response = await request('GET', `/api/auth/exists?username=${'a'.repeat(21)}`, '192.168.6.1');

      expect(response.status).toBe(400);
      expect(checkUsernameExistsSpy).not.toHaveBeenCalled();
    });

    it('should answer an exists check for a valid username', async () => {
      const checkUsernameExistsSpy = jest.spyOn(Auth, 'checkUsernameExists').mockResolvedValue(true);

      const response = await request('GET', '/api/auth/exists?username=testuser', '192.168.6.2');

      expect(checkUsernameExistsSpy).toHaveBeenCalledWith('testuser');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ exists: true });
    });

    it('should reject a password reset request with an invalid user param', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const sendPasswordResetSpy = jest.spyOn(Auth, 'sendPasswordReset');

      const response = await request('DELETE', `/api/auth/password/${'a'.repeat(61)}`, '192.168.6.3');

      expect(response.status).toBe(400);
      expect(sendPasswordResetSpy).not.toHaveBeenCalled();
    });

    it('should reject an account activation with a malformed one-time id', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const activateAccountSpy = jest.spyOn(Auth, 'activateAccount');

      const response = await request('PUT', '/api/auth/register/not-a-uuid', '192.168.6.4');

      expect(response.status).toBe(400);
      expect(activateAccountSpy).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('should let at most ten failed login attempts per IP and username through and block the next with 429', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const loginSpy = jest.spyOn(Auth, 'login').mockRejectedValue(APIRejectReason.NotFound);

      for (let i = 0; i < 10; i++) {
        await request('POST', '/api/auth/login', '192.168.4.1', { username: 'u', password: 'p' });
      }
      const blockedSameCase = await request('POST', '/api/auth/login', '192.168.4.1', {
        username: 'u',
        password: 'p'
      });
      const blockedNormalized = await request('POST', '/api/auth/login', '192.168.4.1', {
        username: '  U  ',
        password: 'p'
      });

      expect(loginSpy).toHaveBeenCalledTimes(10);
      expect(blockedSameCase.status).toBe(429);
      expect(blockedNormalized.status).toBe(429);
    });

    it('should not lock out another account on the same IP when one account exhausted its login limit', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const loginSpy = jest.spyOn(Auth, 'login').mockRejectedValue(APIRejectReason.NotFound);

      for (let i = 0; i < 10; i++) {
        await request('POST', '/api/auth/login', '192.168.4.4', { username: 'alice', password: 'p' });
      }
      const blockedAlice = await request('POST', '/api/auth/login', '192.168.4.4', {
        username: 'alice',
        password: 'p'
      });
      loginSpy.mockResolvedValueOnce(<any>{
        sessionToken: 'token',
        username: 'bob',
        email: 'bob@example.com'
      });
      const allowedBob = await request('POST', '/api/auth/login', '192.168.4.4', {
        username: 'bob',
        password: 'p'
      });

      expect(blockedAlice.status).toBe(429);
      expect(allowedBob.status).toBe(200);
    });

    it('should enforce the IP-wide login ceiling across distinct usernames', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const loginSpy = jest.spyOn(Auth, 'login').mockRejectedValue(APIRejectReason.NotFound);

      for (let i = 0; i < 50; i++) {
        await request('POST', '/api/auth/login', '192.168.4.5', {
          username: `user${i}`,
          password: 'p'
        });
      }
      const blocked = await request('POST', '/api/auth/login', '192.168.4.5', {
        username: 'user50',
        password: 'p'
      });

      expect(loginSpy).toHaveBeenCalledTimes(50);
      expect(blocked.status).toBe(429);
    });

    it('should not count successful logins toward the login rate limit', async () => {
      const loginSpy = jest.spyOn(Auth, 'login').mockResolvedValue(<any>{
        sessionToken: 'token',
        username: 'testuser',
        email: 'test@example.com'
      });

      const statuses: number[] = [];
      for (let i = 0; i < 55; i++) {
        const response = await request('POST', '/api/auth/login', '192.168.4.3', {
          username: 'u',
          password: 'p'
        });
        statuses.push(response.status);
      }

      expect(statuses).not.toContain(429);
      expect(loginSpy).toHaveBeenCalledTimes(55);
    });

    it('should not block a login attempt from an IP whose limit was not exhausted by another client', async () => {
      jest.spyOn(Auth, 'login').mockResolvedValue(<any>{
        sessionToken: 'token',
        username: 'testuser',
        email: 'test@example.com'
      });

      const response = await request('POST', '/api/auth/login', '192.168.4.2', {
        username: 'u',
        password: 'p'
      });

      expect(response.status).toBe(200);
    });

    it('should let at most ten valid password reset requests per IP through and block the next with 429', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const sendPasswordResetSpy = jest.spyOn(Auth, 'sendPasswordReset').mockResolvedValue(undefined);

      for (let i = 0; i < 10; i++) {
        await request('DELETE', '/api/auth/password/testuser', '192.168.5.1');
      }
      const blocked = await request('DELETE', '/api/auth/password/testuser', '192.168.5.1');

      expect(sendPasswordResetSpy).toHaveBeenCalledTimes(10);
      expect(blocked.status).toBe(429);
    });

    it('should not count malformed password reset params against the password reset rate limit', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const sendPasswordResetSpy = jest.spyOn(Auth, 'sendPasswordReset').mockResolvedValue(undefined);

      for (let i = 0; i < 12; i++) {
        const invalid = await request('DELETE', '/api/auth/password/ab', '192.168.5.2');
        expect(invalid.status).toBe(400);
      }
      const valid = await request('DELETE', '/api/auth/password/testuser', '192.168.5.2');

      expect(valid.status).toBe(202);
      expect(sendPasswordResetSpy).toHaveBeenCalledTimes(1);
    });

    it('should let at most 25 valid registrations per IP through without counting invalid bodies', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      jest.spyOn(Auth, 'checkUsernameExists').mockResolvedValue(false);
      jest.spyOn(Auth, 'checkEmailExists').mockResolvedValue(false);
      const registerSpy = jest.spyOn(Auth, 'register').mockResolvedValue(<any>{
        userId: 42,
        username: 'testuser',
        email: 'test@example.com'
      });

      for (let i = 0; i < 30; i++) {
        const invalid = await request('POST', '/api/auth/register', '192.168.8.1', {
          ...validRegisterBody,
          password: 'password'
        });
        expect(invalid.status).toBe(400);
      }

      for (let i = 0; i < 25; i++) {
        const created = await request('POST', '/api/auth/register', '192.168.8.1', validRegisterBody);
        expect(created.status).toBe(201);
      }
      const blocked = await request('POST', '/api/auth/register', '192.168.8.1', validRegisterBody);

      expect(registerSpy).toHaveBeenCalledTimes(25);
      expect(blocked.status).toBe(429);
    });

    it('should log a warning and allow requests through when rate_limit.dry_run is enabled', async () => {
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
      const originalGet = config.get.bind(config);
      jest
        .spyOn(config, 'get')
        .mockImplementation((setting: string) =>
          setting === 'rate_limit.dry_run' ? true : originalGet(setting)
        );
      const sendPasswordResetSpy = jest.spyOn(Auth, 'sendPasswordReset').mockResolvedValue(undefined);

      for (let i = 0; i < 10; i++) {
        await request('DELETE', '/api/auth/password/testuser', '192.168.9.1');
      }
      const eleventh = await request('DELETE', '/api/auth/password/testuser', '192.168.9.1');

      expect(eleventh.status).toBe(202);
      expect(sendPasswordResetSpy).toHaveBeenCalledTimes(11);
      expect(warnSpy).toHaveBeenCalledWith(
        'Rate limit exceeded (dry-run) for DELETE /api/auth/password/:user from IP 192.168.9.1'
      );
    });

    it('should block the session-backed login endpoints after 120 requests per IP with 429', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      // Every request without a session token is rejected with a 401 by the session
      // middleware of the resource router, so the test needs no database mock
      const statuses: number[] = [];
      for (let i = 0; i <= 120; i++) {
        const response = await request('GET', '/api/auth/login', '192.168.7.1');
        statuses.push(response.status);
      }

      expect(statuses.filter(status => status == 401)).toHaveLength(120);
      expect(statuses.filter(status => status == 429)).toHaveLength(1);
    });
  });
});
