import { DailyType } from '../../shared/config/enums';
import { DAILY_DEFINITIONS } from '../../shared/config/dailies';
import DBDailiesDAO from './db_dailies';
import DBConnection from './db_connector';
import * as dailySelector from '../utils/daily_selector';

describe('DBDailiesDAO', () => {
  describe('achieve', () => {
    it('should handle login daily achievement', async () => {
      const userId = 123;
      const dailyType = DailyType.Login;

      // Mock isDailyOfDay to return true for login
      jest.spyOn(dailySelector, 'isDailyOfDay').mockReturnValue(true);

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
      jest.spyOn(dailySelector, 'isDailyOfDay').mockReturnValue(false);

      const querySpy = jest.spyOn(DBConnection.instance, 'query');

      // Call the method
      await DBDailiesDAO.achieve(userId, dailyType);

      // Verify no query was made
      expect(querySpy).not.toHaveBeenCalled();

      // Clean up
      querySpy.mockRestore();
    });
  });
});
