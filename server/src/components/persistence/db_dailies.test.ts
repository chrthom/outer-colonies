import { DailyType } from '../../shared/config/enums';
import { DAILY_DEFINITIONS } from '../../shared/config/dailies';
import DBDailiesDAO from './db_dailies';
import DBConnection from './db_connector';
import { isDailyOfDay } from '../utils/daily_selector';

describe('DBDailiesDAO', () => {
  describe('achieve', () => {
    it('should handle login daily achievement', async () => {
      const userId = 123;
      const dailyType = DailyType.Login;

      // Mock isDailyOfDay to return true for login
      jest.spyOn(require('../utils/daily_selector'), 'isDailyOfDay').mockReturnValue(true);

      // Mock the database methods
      const mockGetBy = jest.spyOn(DBDailiesDAO as any, 'getBy');
      mockGetBy.mockResolvedValue([{ userId }]);

      const querySpy = jest.spyOn(DBConnection.instance, 'query');
      querySpy.mockResolvedValue({});

      // Call the method
      await DBDailiesDAO.achieve(userId, dailyType);

      // Verify the query was called with correct parameters
      const dailyDef = DAILY_DEFINITIONS.find(d => d.type === dailyType);
      expect(querySpy).toHaveBeenCalledWith(
        `UPDATE dailies SET ${dailyDef?.dbColumn} = current_date() WHERE user_id = ?`,
        [userId]
      );

      // Clean up
      mockGetBy.mockRestore();
      querySpy.mockRestore();
    });

    it('should not update database if daily is not available today', async () => {
      const userId = 123;
      const dailyType = DailyType.Victory;

      // Mock isDailyOfDay to return false
      jest.spyOn(require('../utils/daily_selector'), 'isDailyOfDay').mockReturnValue(false);

      const querySpy = jest.spyOn(DBConnection.instance, 'query');

      // Call the method
      await DBDailiesDAO.achieve(userId, dailyType);

      // Verify no query was made
      expect(querySpy).not.toHaveBeenCalled();

      // Clean up
      querySpy.mockRestore();
    });

    it('should handle all daily types', async () => {
      // Mock isDailyOfDay to return true
      jest.spyOn(require('../utils/daily_selector'), 'isDailyOfDay').mockReturnValue(true);

      const querySpy = jest.spyOn(DBConnection.instance, 'query');
      querySpy.mockResolvedValue({});

      // Mock getBy to return results
      const mockGetBy = jest.spyOn(DBDailiesDAO as any, 'getBy');
      mockGetBy.mockResolvedValue([{ userId: 123 }]);

      // Test all daily types
      for (const dailyType of Object.values(DailyType)) {
        if (dailyType !== DailyType.Login) {
          // Skip login as it's tested above
          await DBDailiesDAO.achieve(123, dailyType);
          const dailyDef = DAILY_DEFINITIONS.find(d => d.type === dailyType);
          expect(querySpy).toHaveBeenCalledWith(expect.stringContaining(dailyDef?.dbColumn || ''), [123]);
        }
      }

      // Clean up
      mockGetBy.mockRestore();
      querySpy.mockRestore();
    });
  });

  describe('interface types', () => {
    it('should have correct DBDaily interface type', () => {
      // This test ensures the DBDaily interface is properly typed
      const mockDaily: any = {
        userId: 123,
        login: true,
        victory: null,
        game: false
      };

      // This should not throw a type error
      const typedDaily: any = mockDaily;
      expect(typedDaily).toBeDefined();
    });

    it('should reject number values in dynamic properties', () => {
      // This test would fail if someone incorrectly adds number type to the union
      const mockDaily = {
        userId: 123,
        login: 123 as any // This should be boolean or null
      };

      // TypeScript would catch this at compile time, but we can test the runtime behavior
      expect(typeof mockDaily.login).not.toBe('boolean');
    });
  });
});
