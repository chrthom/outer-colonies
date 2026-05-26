import { DailyType } from '../shared/config/enums';
import { DAILY_DEFINITIONS } from '../shared/config/dailies';
import DBDailiesDAO from './persistence/db_dailies';
import { getDailies, getDailiesResponse } from './rest_api';
import * as dailySelector from './utils/daily_selector';

describe('RESTAPI Daily Endpoints', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getDailiesResponse', () => {
    it('should preserve values for available dailies and null out the rest', () => {
      jest
        .spyOn(dailySelector, 'getDailiesOfDay')
        .mockReturnValue([DailyType.Login, DailyType.Victory]);

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
