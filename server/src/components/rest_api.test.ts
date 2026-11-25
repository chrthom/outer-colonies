import express from 'express';
import http, { IncomingMessage, RequestOptions } from 'node:http';
import { Readable } from 'node:stream';
import config from 'config';
import restAPI from './rest_api';
import Auth from './utils/auth';
import Mailer from './utils/mailer';
import DBCredentialsDAO from './persistence/db_credentials';
import DBConnection from './persistence/db_connector';
import DBMagicLinksDAO from './persistence/db_magic_links';
import DBDecksDAO from './persistence/db_decks';
import DBProfilesDAO from './persistence/db_profiles';
import DBDailiesDAO from './persistence/db_dailies';
import DBItemsDAO from './persistence/db_items';
import { APIRejectReason } from '../shared/config/enums';
import { markOnline, resetOnlineUsers } from './online_users';
import { Server, Socket } from 'socket.io';
import { rules } from '../shared/config/rules';

/**
 * Integration harness: builds the real express app with all routers mounted (as `app.ts` does)
 * and answers requests over local HTTP, so tests exercise the actual routing, the session
 * middleware and the central error handling instead of single handler functions.
 */
describe('REST API', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(done => {
    const app = express();
    app.use(express.json());
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
   * @param path request path (with concrete ids)
   * @param sessionToken optional `session-token` header value
   * @param body optional JSON request body, or a raw payload string sent as-is (e.g. malformed
   *        JSON to trigger a body-parser error)
   * @returns the responded status code and body
   */
  function request(
    method: string,
    path: string,
    sessionToken?: string,
    body?: object | string,
    targetBaseUrl = baseUrl
  ): Promise<TestResponse> {
    const options: RequestOptions = { method, agent: false };
    const payload = body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
    if (payload !== undefined) options.headers = { 'Content-Type': 'application/json' };
    if (sessionToken !== undefined) {
      options.headers = { ...(options.headers ?? {}), 'session-token': sessionToken };
    }
    return new Promise((resolve, reject) => {
      const req = http.request(`${targetBaseUrl}${path}`, options, (res: IncomingMessage) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const isJson = res.headers['content-type']?.includes('application/json');
            resolve({
              status: res.statusCode ?? 0,
              body: data ? (isJson ? JSON.parse(data) : data) : undefined
            });
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

  const validCredentials = {
    userId: 123,
    username: 'testuser',
    email: 'test@example.com',
    sessionToken: 'valid-token'
  };

  const mockValidSession = () =>
    jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockResolvedValue(validCredentials);

  /** Runs the transaction callback without a database connection, for handler tests. */
  const mockTransaction = () =>
    jest.spyOn(DBConnection.instance, 'transaction').mockImplementation(<T>(f: () => Promise<T>) => f());

  describe('session authentication per endpoint', () => {
    interface AuthenticatedEndpoint {
      method: string;
      path: string;
      body?: object;
      expectedStatus: number;
      expectedBody?: object;
      /** Mocks the handler dependencies so the endpoint can run through with a valid session. */
      setup: () => void;
      /** Asserts that the handler ran with the authenticated user's data. */
      assert: () => void;
    }

    const authenticatedEndpoints: AuthenticatedEndpoint[] = [
      {
        method: 'GET',
        path: '/api/auth/login',
        expectedStatus: 200,
        expectedBody: {
          sessionToken: 'valid-token',
          username: 'testuser',
          email: 'test@example.com'
        },
        setup: () => undefined,
        assert: () => undefined
      },
      {
        method: 'DELETE',
        path: '/api/auth/login',
        expectedStatus: 204,
        setup: () => jest.spyOn(DBCredentialsDAO, 'invalidateSessionToken').mockResolvedValue(undefined),
        assert: () => expect(DBCredentialsDAO.invalidateSessionToken).toHaveBeenCalledWith('valid-token')
      },
      {
        method: 'PUT',
        path: '/api/auth/password',
        body: { password: 'new-secret' },
        expectedStatus: 204,
        setup: () => jest.spyOn(DBCredentialsDAO, 'setPassword').mockResolvedValue(undefined),
        assert: () => expect(DBCredentialsDAO.setPassword).toHaveBeenCalledWith(123, 'new-secret')
      },
      {
        method: 'POST',
        path: '/api/auth/email',
        body: { email: 'new@example.com' },
        expectedStatus: 202,
        setup: () => {
          jest.spyOn(DBMagicLinksDAO, 'createEmailConfirmation').mockResolvedValue('uuid-123');
          jest.spyOn(Mailer, 'sendEmailConfirmation').mockResolvedValue(<any>undefined);
        },
        assert: () =>
          expect(DBMagicLinksDAO.createEmailConfirmation).toHaveBeenCalledWith(123, 'new@example.com')
      },
      {
        method: 'GET',
        path: '/api/deck',
        expectedStatus: 200,
        expectedBody: { cards: [] },
        setup: () => jest.spyOn(DBDecksDAO, 'getByUserId').mockResolvedValue([]),
        assert: () => expect(DBDecksDAO.getByUserId).toHaveBeenCalledWith(123)
      },
      {
        method: 'POST',
        path: '/api/deck/456',
        expectedStatus: 204,
        setup: () => jest.spyOn(DBDecksDAO, 'setInUse').mockResolvedValue(undefined),
        assert: () => expect(DBDecksDAO.setInUse).toHaveBeenCalledWith(123, 456, true)
      },
      {
        method: 'DELETE',
        path: '/api/deck/456',
        expectedStatus: 204,
        setup: () => jest.spyOn(DBDecksDAO, 'setInUse').mockResolvedValue(undefined),
        assert: () => expect(DBDecksDAO.setInUse).toHaveBeenCalledWith(123, 456, false)
      },
      {
        method: 'GET',
        path: '/api/profile',
        expectedStatus: 200,
        expectedBody: { userId: 123, sol: 100, newsletter: false },
        setup: () =>
          jest
            .spyOn(DBProfilesDAO, 'getByUserId')
            .mockResolvedValue({ userId: 123, sol: 100, newsletter: false }),
        assert: () => expect(DBProfilesDAO.getByUserId).toHaveBeenCalledWith(123)
      },
      {
        method: 'PUT',
        path: '/api/profile/newsletter',
        expectedStatus: 204,
        setup: () => jest.spyOn(DBProfilesDAO, 'setNewsletter').mockResolvedValue(undefined),
        assert: () => expect(DBProfilesDAO.setNewsletter).toHaveBeenCalledWith(123, true)
      },
      {
        method: 'DELETE',
        path: '/api/profile/newsletter',
        expectedStatus: 204,
        setup: () => jest.spyOn(DBProfilesDAO, 'setNewsletter').mockResolvedValue(undefined),
        assert: () => expect(DBProfilesDAO.setNewsletter).toHaveBeenCalledWith(123, false)
      },
      {
        method: 'GET',
        path: '/api/daily',
        expectedStatus: 200,
        setup: () => jest.spyOn(DBDailiesDAO, 'getByUserId').mockResolvedValue({ userId: 123 }),
        assert: () => expect(DBDailiesDAO.getByUserId).toHaveBeenCalledWith(123)
      },
      {
        method: 'GET',
        path: '/api/item',
        expectedStatus: 200,
        expectedBody: { boxes: [], boosters: [] },
        setup: () => jest.spyOn(DBItemsDAO, 'getByUserId').mockResolvedValue([]),
        assert: () => expect(DBItemsDAO.getByUserId).toHaveBeenCalledWith(123)
      },
      {
        method: 'POST',
        path: '/api/item/7',
        expectedStatus: 404,
        setup: () => {
          mockTransaction();
          jest.spyOn(DBItemsDAO, 'getByUserId').mockResolvedValue([]);
        },
        assert: () => expect(DBItemsDAO.getByUserId).toHaveBeenCalledWith(123)
      },
      {
        method: 'POST',
        path: '/api/buy/booster/2',
        expectedStatus: 201,
        setup: () => {
          mockTransaction();
          jest.spyOn(DBProfilesDAO, 'decreaseSol').mockResolvedValue(undefined);
          jest.spyOn(DBItemsDAO, 'createBooster').mockResolvedValue(undefined);
        },
        assert: () => expect(DBProfilesDAO.decreaseSol).toHaveBeenCalledWith(123, rules.boosterCosts[2])
      }
    ];

    describe.each(authenticatedEndpoints)('$method $path', endpoint => {
      it('should reject requests without a session token with 401', async () => {
        const response = await request(endpoint.method, endpoint.path, undefined, endpoint.body);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('No session-token header provided');
      });

      it('should reject requests with an invalid session token with 403', async () => {
        jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockRejectedValue(APIRejectReason.NotFound);

        const response = await request(endpoint.method, endpoint.path, 'invalid-token', endpoint.body);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Forbidden');
      });

      it('should pass the authenticated user to the handler with a valid session token', async () => {
        endpoint.setup();
        mockValidSession();

        const response = await request(endpoint.method, endpoint.path, 'valid-token', endpoint.body);

        expect(response.status).toBe(endpoint.expectedStatus);
        if (endpoint.expectedBody) expect(response.body).toEqual(endpoint.expectedBody);
        endpoint.assert();
      });
    });
  });

  describe('unauthenticated auth endpoints', () => {
    it('should respond with 401 and no credentials for a failed login', async () => {
      jest.spyOn(Auth, 'login').mockRejectedValue(APIRejectReason.NotFound);

      const response = await request('POST', '/api/auth/login', undefined, {
        username: 'testuser',
        password: 'wrong'
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should respond with the session credentials for a successful login', async () => {
      jest.spyOn(Auth, 'login').mockResolvedValue(validCredentials);

      const response = await request('POST', '/api/auth/login', undefined, {
        username: 'testuser',
        password: 'secret'
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        sessionToken: 'valid-token',
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should respond with 409 when the username already exists', async () => {
      jest.spyOn(Auth, 'checkUsernameExists').mockResolvedValue(true);

      const response = await request('POST', '/api/auth/register', undefined, {
        username: 'testuser',
        password: 'secret',
        email: 'test@example.com',
        starterDeck: 1,
        newsletter: false
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Username already exists');
    });

    it('should reject an exists check without username or email parameter', async () => {
      const response = await request('GET', '/api/auth/exists');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No username or email parameter was provided');
    });

    it('should respond with 404 for an unknown account activation link', async () => {
      jest.spyOn(Auth, 'activateAccount').mockRejectedValue(APIRejectReason.NotFound);

      const response = await request('PUT', '/api/auth/register/unknown-uuid');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Not Found');
    });
  });

  describe('error status logging', () => {
    it('should log a WARN with method and route pattern instead of the concrete path for a 401', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const response = await request('POST', '/api/deck/456');

      expect(response.status).toBe(401);
      expect(errorSpy).toHaveBeenCalledWith(
        'WARN: API request for POST /api/deck/:cardInstanceId(\\d+) failed with status 401'
      );
      expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('/api/deck/456'));
    });

    it('should log an ERROR for an internal server error', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockValidSession();
      jest.spyOn(DBDecksDAO, 'setInUse').mockRejectedValue(new Error('insert failed'));

      const response = await request('POST', '/api/deck/456', 'valid-token');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/^ERROR: .*status 500/));
    });

    it('should not log on a successful response', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockValidSession();
      jest.spyOn(DBDecksDAO, 'setInUse').mockResolvedValue(undefined);

      const response = await request('POST', '/api/deck/456', 'valid-token');

      expect(response.status).toBe(204);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('upstream middleware errors', () => {
    it('should preserve the status of a malformed-JSON body-parser error instead of collapsing it to 500', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const response = await request('POST', '/api/auth/login', undefined, '{ not valid json');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Bad Request');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/^WARN: .*status 400/));
    });
  });

  describe('assets proxy', () => {
    it('should respond with 404 on non-development stages', async () => {
      const response = await request('GET', '/assets/anything');

      expect(response.status).toBe(404);
    });

    describe('on development stage', () => {
      let devServer: http.Server;
      let devBaseUrl: string;

      beforeAll(done => {
        const originalGet = config.get.bind(config);
        jest
          .spyOn(config, 'get')
          .mockImplementation((setting: string) =>
            setting === 'stage' ? 'development' : originalGet(setting)
          );
        const devApp = express();
        devApp.use(express.json());
        restAPI(devApp);
        jest.restoreAllMocks();
        devServer = http.createServer(devApp).listen(0, () => {
          const address = devServer.address() as { port: number };
          devBaseUrl = `http://127.0.0.1:${address.port}`;
          done();
        });
      });

      afterAll(done => {
        devServer.close(done);
      });

      it('should respond with 502 when the upstream asset stream fails mid-stream', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const upstream = new Readable({
          read() {
            this.destroy(new Error('boom'));
          }
        });
        jest
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(<any>{ ok: true, status: 200, body: Readable.toWeb(upstream) });

        const response = await request('GET', '/assets/test.png', undefined, undefined, devBaseUrl);

        expect(response.status).toBe(502);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/^WARN: .*boom/));
      });

      it('should respond with 502 when the upstream responds with an error status', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const upstream = new Readable({
          read() {
            this.push('upstream error page');
            this.push(null);
          }
        });
        jest
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(<any>{ ok: false, status: 404, body: Readable.toWeb(upstream) });

        const response = await request('GET', '/assets/missing.png', undefined, undefined, devBaseUrl);

        expect(response.status).toBe(502);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/^WARN: .*upstream status 404/));
      });
    });
  });

  describe('online users', () => {
    afterEach(() => {
      resetOnlineUsers();
    });

    it('should respond with the count of unique online users without a session token', async () => {
      const io = { emit: jest.fn() } as unknown as Server;
      markOnline(io, { id: 'a', emit: jest.fn() } as unknown as Socket, 1);
      markOnline(io, { id: 'b', emit: jest.fn() } as unknown as Socket, 1);
      markOnline(io, { id: 'c', emit: jest.fn() } as unknown as Socket, 2);

      const response = await request('GET', '/api/online');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 2 });
    });
  });
});
