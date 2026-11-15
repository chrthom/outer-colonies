import { APIRejectReason, DailyType } from '../shared/config/enums';
import { DAILY_DEFINITIONS } from '../shared/config/dailies';
import DBCredentialsDAO from './persistence/db_credentials';
import DBDailiesDAO from './persistence/db_dailies';
import DBDecksDAO from './persistence/db_decks';
import restAPI, { getDailies, getDailiesResponse } from './rest_api';
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
    params: { cardInstanceId: '456' }
  });
  const createResponse = () => {
    const res: any = { send: jest.fn() };
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
});
