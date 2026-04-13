import { DailyType } from '../shared/config/enums';
import { DAILY_DEFINITIONS } from '../shared/config/dailies';
import DBDailiesDAO from './persistence/db_dailies';
import { getDailies, getDailiesResponse } from './rest_api';

describe('RESTAPI Daily Endpoints', () => {
  describe('getDailies', () => {
    it('should return correct daily response structure', async () => {
      // Mock database response
      const mockDailyData1 = {
        userId: 123,
        login: true,
        victory: null,
        game: false,
        energy: true
      };

      const getByUserIdSpy = jest.spyOn(DBDailiesDAO, 'getByUserId');
      getByUserIdSpy.mockResolvedValue(mockDailyData1);

      // Mock getDailiesOfDay to return some daily types
      const mockGetDailiesOfDay = jest.spyOn(require('./utils/daily_selector'), 'getDailiesOfDay');
      mockGetDailiesOfDay.mockReturnValue([
        DailyType.Login,
        DailyType.Energy,
        DailyType.Victory,
        DailyType.Game
      ]);

      // Call the method
      const result = await getDailies(123);

      // Verify the response structure
      expect(result).toBeDefined();
      expect(result['login']).toBe(true);
      expect(result['victory']).toBe(null);
      expect(result['game']).toBe(false);
      expect(result['energy']).toBe(true);

      // Verify that unavailable dailies are set to null
      const unavailableDaily = DAILY_DEFINITIONS.find(d => d.type === DailyType.Ships);
      if (unavailableDaily) {
        expect(result[unavailableDaily.dbColumn]).toBe(null);
      }

      // Clean up
      getByUserIdSpy.mockRestore();
      mockGetDailiesOfDay.mockRestore();
    });

    it('should handle all daily types in response', async () => {
      // Mock database response with all dailies
      const allDailiesData: any = { userId: 123 };
      DAILY_DEFINITIONS.forEach(dailyDef => {
        allDailiesData[dailyDef.dbColumn] = Math.random() > 0.5; // Random boolean
      });

      const getByUserIdSpy2 = jest.spyOn(DBDailiesDAO, 'getByUserId');
      getByUserIdSpy2.mockResolvedValue(allDailiesData);

      // Mock getDailiesOfDay to return all daily types
      const mockGetDailiesOfDay2 = jest.spyOn(require('./utils/daily_selector'), 'getDailiesOfDay');
      mockGetDailiesOfDay2.mockReturnValue(DAILY_DEFINITIONS.map(d => d.type));

      // Call the method
      const result = await getDailies(123);

      // Verify all daily types are present in response
      DAILY_DEFINITIONS.forEach(dailyDef => {
        expect(result).toHaveProperty(dailyDef.dbColumn);
        expect(result[dailyDef.dbColumn]).not.toBeUndefined();
      });

      // Clean up
      getByUserIdSpy2.mockRestore();
      mockGetDailiesOfDay2.mockRestore();
    });

    it('should set unavailable dailies to null', async () => {
      // Mock database response
      const mockDailyData3 = {
        userId: 123,
        login: true,
        victory: true
      };

      const getByUserIdSpy3 = jest.spyOn(DBDailiesDAO, 'getByUserId');
      getByUserIdSpy3.mockResolvedValue(mockDailyData3);

      // Mock getDailiesOfDay to return only login daily
      const mockGetDailiesOfDay3 = jest.spyOn(require('./utils/daily_selector'), 'getDailiesOfDay');
      mockGetDailiesOfDay3.mockReturnValue([DailyType.Login]);

      // Call the method
      const result = await getDailies(123);

      // Verify that only login is available, others are null
      expect(result['login']).toBe(true);
      expect(result['victory']).toBe(null);

      // Check that other dailies are also null
      const otherDaily = DAILY_DEFINITIONS.find(d => d.type === DailyType.Game);
      if (otherDaily) {
        expect(result[otherDaily.dbColumn]).toBe(null);
      }

      // Clean up
      getByUserIdSpy3.mockRestore();
      mockGetDailiesOfDay3.mockRestore();
    });
  });

  describe('getDailiesResponse', () => {
    it('should correctly transform daily data to response format', () => {
      const mockDailyData = {
        userId: 123,
        login: true,
        victory: false,
        game: null
      };

      // Mock getDailiesOfDay
      const mockGetDailiesOfDay = jest.spyOn(require('./utils/daily_selector'), 'getDailiesOfDay');
      mockGetDailiesOfDay.mockReturnValue([DailyType.Login, DailyType.Victory, DailyType.Game]);

      const result = getDailiesResponse(mockDailyData);

      expect(result['login']).toBe(true);
      expect(result['victory']).toBe(false);
      expect(result['game']).toBe(null);

      // Verify unavailable dailies are null
      const unavailableDaily = DAILY_DEFINITIONS.find(d => d.type === DailyType.Energy);
      if (unavailableDaily) {
        expect(result[unavailableDaily.dbColumn]).toBe(null);
      }

      mockGetDailiesOfDay.mockRestore();
    });
  });
});
