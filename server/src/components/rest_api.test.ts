import { APIRejectReason, DailyType, ItemBoxContentType, ItemType } from '../shared/config/enums';
import { DAILY_DEFINITIONS } from '../shared/config/dailies';
import { rules } from '../shared/config/rules';
import DBConnection from './persistence/db_connector';
import DBCredentialsDAO from './persistence/db_credentials';
import DBDailiesDAO from './persistence/db_dailies';
import DBDecksDAO from './persistence/db_decks';
import DBItemsDAO from './persistence/db_items';
import DBProfilesDAO from './persistence/db_profiles';
import CardCollection from './cards/collection/card_collection';
import restAPI, { buyBooster, getDailies, getDailiesResponse, INVALID_ITEM_TYPE, openItem } from './rest_api';
import Auth from './utils/auth';
import * as dailySelector from './utils/daily_selector';

describe('RESTAPI Daily Endpoints', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getDailiesResponse', () => {
    it('should preserve values for available dailies and null out the rest', () => {
      jest.spyOn(dailySelector, 'getDailiesOfDay').mockReturnValue([DailyType.Login, DailyType.Victory]);

      const daily: any = { userId: 1, login: true, victory: false, game: true, energy: false };

      const result = getDailiesResponse(daily);

      expect(result['login']).toBe(true);
      expect(result['victory']).toBe(false);

      const unavailable = DAILY_DEFINITIONS.filter(
        d => d.type !== DailyType.Login && d.type !== DailyType.Victory
      );
      unavailable.forEach(d => expect(result[d.dbColumn]).toBeNull());
    });
  });

  describe('getDailies', () => {
    it('should fetch the daily record by user id and project it through the response transform', async () => {
      const dbRow: any = { userId: 42, login: true };
      const getByUserIdSpy = jest.spyOn(DBDailiesDAO, 'getByUserId').mockResolvedValue(dbRow);
      jest.spyOn(dailySelector, 'getDailiesOfDay').mockReturnValue([DailyType.Login]);

      const result = await getDailies(42);

      expect(getByUserIdSpy).toHaveBeenCalledWith(42);
      expect(result['login']).toBe(true);
      const otherColumn = DAILY_DEFINITIONS.find(d => d.type !== DailyType.Login)!.dbColumn;
      expect(result[otherColumn]).toBeNull();
    });
  });
});

describe('RESTAPI Deck Endpoints', () => {
  type RouteHandler = (req: any, res: any) => void;
  const routes = new Map<string, RouteHandler>();

  beforeAll(() => {
    const fakeApp: any = {
      get: (path: string, handler: RouteHandler) => routes.set(`GET ${path}`, handler),
      post: (path: string, handler: RouteHandler) => routes.set(`POST ${path}`, handler),
      put: (path: string, handler: RouteHandler) => routes.set(`PUT ${path}`, handler),
      delete: (path: string, handler: RouteHandler) => routes.set(`DELETE ${path}`, handler)
    };
    restAPI(fakeApp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createRequest = (sessionToken?: string) => ({
    header: jest.fn().mockReturnValue(sessionToken),
    params: { cardInstanceId: '456' },
    method: 'POST',
    path: '/api/deck/456',
    route: { path: '/api/deck/:cardInstanceId(\\d+)' }
  });
  const createResponse = (req?: object) => {
    const res: any = { send: jest.fn(), req: req ?? createRequest() };
    res.status = jest.fn().mockReturnThis();
    return res;
  };
  const flushMicrotasks = () => new Promise(resolve => setImmediate(resolve));

  describe.each([
    ['POST', true],
    ['DELETE', false]
  ])('%s /api/deck/:cardInstanceId', (method, expectedInUse) => {
    const getHandler = () => routes.get(`${method} /api/deck/:cardInstanceId(\\d+)`)!;

    it('should reject requests without a session token', async () => {
      const setInUseSpy = jest.spyOn(DBDecksDAO, 'setInUse');
      const res = createResponse();

      getHandler()(createRequest(), res);
      await flushMicrotasks();

      expect(res.status).toHaveBeenCalledWith(401);
      expect(setInUseSpy).not.toHaveBeenCalled();
    });

    it('should reject requests with an invalid session token', async () => {
      const setInUseSpy = jest.spyOn(DBDecksDAO, 'setInUse');
      jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockRejectedValue(APIRejectReason.NotFound);
      const res = createResponse();

      getHandler()(createRequest('invalid-token'), res);
      await flushMicrotasks();

      expect(res.status).toHaveBeenCalledWith(403);
      expect(setInUseSpy).not.toHaveBeenCalled();
    });

    it('should update only the authenticated user card with a valid session token', async () => {
      const setInUseSpy = jest.spyOn(DBDecksDAO, 'setInUse').mockResolvedValue(undefined);
      jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockResolvedValue({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com',
        sessionToken: 'valid-token'
      });
      const res = createResponse();

      getHandler()(createRequest('valid-token'), res);
      await flushMicrotasks();

      expect(setInUseSpy).toHaveBeenCalledWith(123, 456, expectedInUse);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('error status logging', () => {
    const getHandler = () => routes.get('POST /api/deck/:cardInstanceId(\\d+)')!;

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log a WARN for a rejected request without a session token', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const res = createResponse();

      getHandler()(createRequest(), res);
      await flushMicrotasks();

      expect(res.status).toHaveBeenCalledWith(401);
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^WARN: .*status 401/));
    });

    it('should log the route pattern instead of the concrete path', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const res = createResponse();

      getHandler()(createRequest(), res);
      await flushMicrotasks();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('for POST /api/deck/:cardInstanceId(\\d+) failed with status 401')
      );
      expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('/api/deck/456'));
    });

    it('should log a WARN for an invalid session token', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockRejectedValue(APIRejectReason.NotFound);
      const res = createResponse();

      getHandler()(createRequest('invalid-token'), res);
      await flushMicrotasks();

      expect(res.status).toHaveBeenCalledWith(403);
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^WARN: .*status 403/));
    });

    it('should log an ERROR for an internal server error', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockResolvedValue({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com',
        sessionToken: 'valid-token'
      });
      jest.spyOn(DBDecksDAO, 'setInUse').mockRejectedValue(new Error('insert failed'));
      const res = createResponse();

      getHandler()(createRequest('valid-token'), res);
      await flushMicrotasks();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^ERROR: .*status 500/));
    });

    it('should not log on a successful response', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      jest.spyOn(DBCredentialsDAO, 'getBySessionToken').mockResolvedValue({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com',
        sessionToken: 'valid-token'
      });
      jest.spyOn(DBDecksDAO, 'setInUse').mockResolvedValue(undefined);
      const res = createResponse();

      getHandler()(createRequest('valid-token'), res);
      await flushMicrotasks();

      expect(res.status).toHaveBeenCalledWith(204);
      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});

describe('RESTAPI Item and Booster Endpoints', () => {
  let fakeConnection: any;

  const setupFakePool = () => {
    fakeConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined)
    };
    DBConnection.instance.pool = <any>{ getConnection: jest.fn().mockResolvedValue(fakeConnection) };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('openItem', () => {
    it('should open a booster in a transaction and await every granted card insert', async () => {
      setupFakePool();
      const item = { itemId: 7, type: ItemType.Booster, content: '3' };
      jest.spyOn(DBItemsDAO, 'getByUserId').mockResolvedValue([item]);
      const deleteSpy = jest.spyOn(DBItemsDAO, 'delete').mockResolvedValue(1);
      const deckCreateSpy = jest.spyOn(DBDecksDAO, 'create').mockResolvedValue(undefined);
      jest
        .spyOn(CardCollection, 'generateBoosterContent')
        .mockReturnValue(<any>[{ id: 101 }, { id: 102 }, { id: 103 }]);

      const response = await openItem(42, 7);

      expect(response.cards).toEqual([101, 102, 103]);
      expect(response.sol).toEqual([]);
      expect(response.boosters).toEqual([]);
      expect(deleteSpy).toHaveBeenCalledWith(7);
      expect(deckCreateSpy).toHaveBeenCalledTimes(3);
      expect(deckCreateSpy).toHaveBeenNthCalledWith(1, 101, 42, false, true);
      expect(deckCreateSpy).toHaveBeenNthCalledWith(2, 102, 42, false, true);
      expect(deckCreateSpy).toHaveBeenNthCalledWith(3, 103, 42, false, true);
      expect(fakeConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(fakeConnection.commit).toHaveBeenCalledTimes(1);
      expect(fakeConnection.rollback).not.toHaveBeenCalled();
    });

    it('should open a box in a transaction and await every granted content statement', async () => {
      setupFakePool();
      const content = [
        { type: ItemBoxContentType.Card, value: 101 },
        { type: ItemBoxContentType.Sol, value: 500 },
        { type: ItemBoxContentType.Booster, value: 3 }
      ];
      const item = { itemId: 8, type: ItemType.Box, content: JSON.stringify(content) };
      jest.spyOn(DBItemsDAO, 'getByUserId').mockResolvedValue([item]);
      const deleteSpy = jest.spyOn(DBItemsDAO, 'delete').mockResolvedValue(1);
      const createBoosterSpy = jest.spyOn(DBItemsDAO, 'createBooster').mockResolvedValue(undefined);
      const deckCreateSpy = jest.spyOn(DBDecksDAO, 'create').mockResolvedValue(undefined);
      const increaseSolSpy = jest.spyOn(DBProfilesDAO, 'increaseSol').mockResolvedValue(undefined);

      const response = await openItem(42, 8);

      expect(response.sol).toEqual([500]);
      expect(response.cards).toEqual([101]);
      expect(response.boosters).toEqual([3]);
      expect(deleteSpy).toHaveBeenCalledWith(8);
      expect(deckCreateSpy).toHaveBeenCalledWith(101, 42);
      expect(increaseSolSpy).toHaveBeenCalledWith(42, 500);
      expect(createBoosterSpy).toHaveBeenCalledWith(42, 3);
      expect(fakeConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(fakeConnection.commit).toHaveBeenCalledTimes(1);
      expect(fakeConnection.rollback).not.toHaveBeenCalled();
    });

    it('should reject with NotFound and roll back if the user does not own the item', async () => {
      setupFakePool();
      jest.spyOn(DBItemsDAO, 'getByUserId').mockResolvedValue([]);

      await expect(openItem(42, 9)).rejects.toBe(APIRejectReason.NotFound);

      expect(fakeConnection.commit).not.toHaveBeenCalled();
      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
    });

    it('should reject with NotFound when the item was already deleted concurrently', async () => {
      setupFakePool();
      const item = { itemId: 7, type: ItemType.Booster, content: '3' };
      jest.spyOn(DBItemsDAO, 'getByUserId').mockResolvedValue([item]);
      jest.spyOn(DBItemsDAO, 'delete').mockResolvedValue(0);
      const deckCreateSpy = jest.spyOn(DBDecksDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(CardCollection, 'generateBoosterContent').mockReturnValue(<any>[{ id: 101 }]);

      await expect(openItem(42, 7)).rejects.toBe(APIRejectReason.NotFound);

      expect(deckCreateSpy).not.toHaveBeenCalled();
      expect(fakeConnection.commit).not.toHaveBeenCalled();
      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
    });

    it('should reject with INVALID_ITEM_TYPE and not delete items of unknown type', async () => {
      setupFakePool();
      const item = { itemId: 10, type: <any>'quest', content: '3' };
      jest.spyOn(DBItemsDAO, 'getByUserId').mockResolvedValue([item]);
      const deleteSpy = jest.spyOn(DBItemsDAO, 'delete').mockResolvedValue(1);

      await expect(openItem(42, 10)).rejects.toBe(INVALID_ITEM_TYPE);

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(fakeConnection.commit).not.toHaveBeenCalled();
      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
    });

    it('should roll back when a granted card insert fails', async () => {
      setupFakePool();
      const item = { itemId: 7, type: ItemType.Booster, content: '3' };
      jest.spyOn(DBItemsDAO, 'getByUserId').mockResolvedValue([item]);
      jest.spyOn(DBItemsDAO, 'delete').mockResolvedValue(1);
      jest.spyOn(DBDecksDAO, 'create').mockRejectedValue(new Error('insert failed'));
      jest.spyOn(CardCollection, 'generateBoosterContent').mockReturnValue(<any>[{ id: 101 }]);

      await expect(openItem(42, 7)).rejects.toThrow('insert failed');

      expect(fakeConnection.commit).not.toHaveBeenCalled();
      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
    });
  });

  describe('buyBooster', () => {
    it('should decrease sol and create the booster inside a committed transaction', async () => {
      setupFakePool();
      const decreaseSolSpy = jest.spyOn(DBProfilesDAO, 'decreaseSol').mockResolvedValue(undefined);
      const createBoosterSpy = jest.spyOn(DBItemsDAO, 'createBooster').mockResolvedValue(undefined);

      await buyBooster(42, 2);

      expect(decreaseSolSpy).toHaveBeenCalledWith(42, rules.boosterCosts[2]);
      expect(createBoosterSpy).toHaveBeenCalledWith(42, 2);
      expect(fakeConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(fakeConnection.commit).toHaveBeenCalledTimes(1);
      expect(fakeConnection.rollback).not.toHaveBeenCalled();
    });

    it('should roll back and propagate the rejection when the purchase condition fails', async () => {
      setupFakePool();
      jest.spyOn(DBProfilesDAO, 'decreaseSol').mockRejectedValue(APIRejectReason.ConditionNotMet);
      const createBoosterSpy = jest.spyOn(DBItemsDAO, 'createBooster').mockResolvedValue(undefined);

      await expect(buyBooster(42, 2)).rejects.toBe(APIRejectReason.ConditionNotMet);

      expect(createBoosterSpy).not.toHaveBeenCalled();
      expect(fakeConnection.commit).not.toHaveBeenCalled();
      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
    });
  });
});

describe('RESTAPI Auth Endpoints', () => {
  type RouteHandler = (req: any, res: any, next?: () => void) => void;
  const routes = new Map<string, RouteHandler>();

  /**
   * Chains all handlers of a route like express does: a handler must call `next` to pass
   * control to the following one. Single-handler routes are returned unchanged. An error
   * passed to `next` terminates the chain, like express would hand it to its error handler.
   */
  const composeRouteHandlers = (handlers: RouteHandler[]): RouteHandler =>
    handlers.length == 1
      ? handlers[0]
      : (req, res) => {
          let index = 0;
          const next = (error?: unknown) => {
            if (error) return;
            index++;
            if (index < handlers.length) handlers[index](req, res, next);
          };
          handlers[0](req, res, next);
        };

  beforeAll(() => {
    const fakeApp: any = {
      get: (path: string, ...handlers: RouteHandler[]) =>
        routes.set(`GET ${path}`, composeRouteHandlers(handlers)),
      post: (path: string, ...handlers: RouteHandler[]) =>
        routes.set(`POST ${path}`, composeRouteHandlers(handlers)),
      put: (path: string, ...handlers: RouteHandler[]) =>
        routes.set(`PUT ${path}`, composeRouteHandlers(handlers)),
      delete: (path: string, ...handlers: RouteHandler[]) =>
        routes.set(`DELETE ${path}`, composeRouteHandlers(handlers))
    };
    restAPI(fakeApp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createRequest = (route: string, ip: string, body?: unknown) => ({
    header: jest.fn(),
    body: body,
    ip: ip,
    method: route.split(' ')[0],
    path: route.split(' ')[1],
    headers: {},
    app: { get: () => 'loopback' },
    params: {},
    query: {},
    route: { path: route.split(' ')[1] }
  });
  const createResponse = (req: object) => {
    const res: any = { req: req, send: jest.fn(), setHeader: jest.fn(), headersSent: false };
    res.status = jest.fn().mockReturnThis();
    return res;
  };
  const flushMicrotasks = () => new Promise(resolve => setImmediate(resolve));
  const validRegisterBody = {
    username: 'testuser',
    password: 'password1',
    email: 'test@example.com',
    starterDeck: 1,
    newsletter: false
  };

  describe('request body validation', () => {
    it.each([
      ['starter deck out of range', { starterDeck: 99 }],
      ['weak password', { password: 'abcdefgh' }],
      ['malformed email', { email: 'not-an-email' }],
      ['short username', { username: 'ab' }],
      ['non-boolean newsletter', { newsletter: 'yes' }]
    ])('should reject a registration with a %s without touching the database', async (_case, invalidBody) => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const checkUsernameExistsSpy = jest.spyOn(Auth, 'checkUsernameExists');
      const res = createResponse(createRequest('POST /api/auth/register', '192.168.1.1'));

      routes.get('POST /api/auth/register')!(
        createRequest('POST /api/auth/register', '192.168.1.1', { ...validRegisterBody, ...invalidBody }),
        res
      );
      await flushMicrotasks();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(checkUsernameExistsSpy).not.toHaveBeenCalled();
    });

    it('should register with the parsed body and respond with the user id', async () => {
      jest.spyOn(Auth, 'checkUsernameExists').mockResolvedValue(false);
      jest.spyOn(Auth, 'checkEmailExists').mockResolvedValue(false);
      const registerSpy = jest
        .spyOn(Auth, 'register')
        .mockResolvedValue(<any>{ userId: 42, username: 'testuser', email: 'test@example.com' });
      const res = createResponse(createRequest('POST /api/auth/register', '192.168.1.2'));

      routes.get('POST /api/auth/register')!(
        createRequest('POST /api/auth/register', '192.168.1.2', {
          ...validRegisterBody,
          username: '  testuser  ',
          starterDeck: '1'
        }),
        res
      );
      await flushMicrotasks();

      expect(registerSpy).toHaveBeenCalledWith({ ...validRegisterBody, starterDeck: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({ id: 42, username: 'testuser' });
    });

    it('should reject a login with an invalid body without an authentication attempt', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const loginSpy = jest.spyOn(Auth, 'login');
      const res = createResponse(createRequest('POST /api/auth/login', '192.168.2.1'));

      routes.get('POST /api/auth/login')!(
        createRequest('POST /api/auth/login', '192.168.2.1', { username: 'testuser', password: '' }),
        res
      );
      await flushMicrotasks();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(loginSpy).not.toHaveBeenCalled();
    });

    it('should reject a password reset with a weak password', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const resetPasswordSpy = jest.spyOn(Auth, 'resetPassword');
      const res = createResponse(createRequest('PUT /api/auth/password/:id', '192.168.3.1'));

      routes.get('PUT /api/auth/password/:id')!(
        createRequest('PUT /api/auth/password/:id', '192.168.3.1', { password: 'abcdefgh' }),
        res
      );
      await flushMicrotasks();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(resetPasswordSpy).not.toHaveBeenCalled();
    });

    it('should reset the password with a strong password', async () => {
      const resetPasswordSpy = jest.spyOn(Auth, 'resetPassword').mockResolvedValue(undefined);
      const res = createResponse(createRequest('PUT /api/auth/password/:id', '192.168.3.2'));

      routes.get('PUT /api/auth/password/:id')!(
        createRequest('PUT /api/auth/password/:id', '192.168.3.2', { password: 'password1' }),
        res
      );
      await flushMicrotasks();

      expect(resetPasswordSpy).toHaveBeenCalledWith(expect.any(String), 'password1');
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('rate limiting', () => {
    it('should let at most ten login attempts per IP through and block the next with 429', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const loginSpy = jest.spyOn(Auth, 'login').mockResolvedValue(<any>{
        sessionToken: 'token',
        username: 'testuser',
        email: 'test@example.com'
      });
      const login = routes.get('POST /api/auth/login')!;

      for (let i = 0; i < 10; i++) {
        login(
          createRequest('POST /api/auth/login', '192.168.4.1', { username: 'u', password: 'p' }),
          createResponse({})
        );
        await flushMicrotasks();
      }
      const blockedRes = createResponse(createRequest('POST /api/auth/login', '192.168.4.1'));
      login(
        createRequest('POST /api/auth/login', '192.168.4.1', { username: 'u', password: 'p' }),
        blockedRes
      );
      await flushMicrotasks();

      expect(loginSpy).toHaveBeenCalledTimes(10);
      expect(blockedRes.status).toHaveBeenCalledWith(429);
    });

    it('should block an eleventh login attempt from a different IP not affected by the limit of another', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const loginSpy = jest.spyOn(Auth, 'login').mockResolvedValue(<any>{
        sessionToken: 'token',
        username: 'testuser',
        email: 'test@example.com'
      });
      const login = routes.get('POST /api/auth/login')!;
      const otherClientRes = createResponse(createRequest('POST /api/auth/login', '192.168.4.2'));

      login(
        createRequest('POST /api/auth/login', '192.168.4.2', { username: 'u', password: 'p' }),
        otherClientRes
      );
      await flushMicrotasks();

      expect(loginSpy).toHaveBeenCalledTimes(1);
      expect(otherClientRes.status).toHaveBeenCalledWith(200);
    });

    it('should let at most five password reset requests per IP through and block the next with 429', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const sendPasswordResetSpy = jest.spyOn(Auth, 'sendPasswordReset').mockResolvedValue(undefined);
      const requestPasswordReset = routes.get('DELETE /api/auth/password/:user')!;

      for (let i = 0; i < 5; i++) {
        requestPasswordReset(
          createRequest('DELETE /api/auth/password/:user', '192.168.5.1'),
          createResponse({})
        );
        await flushMicrotasks();
      }
      const blockedRes = createResponse(createRequest('DELETE /api/auth/password/:user', '192.168.5.1'));
      requestPasswordReset(createRequest('DELETE /api/auth/password/:user', '192.168.5.1'), blockedRes);
      await flushMicrotasks();

      expect(sendPasswordResetSpy).toHaveBeenCalledTimes(5);
      expect(blockedRes.status).toHaveBeenCalledWith(429);
    });
  });
});
