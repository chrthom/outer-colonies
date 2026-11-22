import { DailyType } from '../../shared/config/enums';
import { DAILY_DEFINITIONS } from '../../shared/config/dailies';
import { getDailiesResponse } from './daily_router';
import * as dailySelector from '../utils/daily_selector';

describe('DailyRouter', () => {
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
});
