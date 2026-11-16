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

      jest.spyOn(dailySelector, 'isDailyOfDay').mockReturnValue(true);

      const mockGetBy = jest.spyOn(DBDailiesDAO as any, 'getBy');
      mockGetBy.mockResolvedValue([{ userId }]);

      const querySpy = jest.spyOn(DBConnection.instance, 'query');
      querySpy.mockResolvedValue({});

      await DBDailiesDAO.achieve(userId, dailyType);

      const dailyDef = DAILY_DEFINITIONS.find(d => d.type === dailyType);
      expect(querySpy).toHaveBeenCalledWith(
        `UPDATE dailies SET ${dailyDef?.dbColumn} = current_date() WHERE user_id = ?`,
        [userId]
      );

      mockGetBy.mockRestore();
      querySpy.mockRestore();
    });

    it('should not update database if daily is not available today', async () => {
      const userId = 123;
      const dailyType = DailyType.Victory;

      jest.spyOn(dailySelector, 'isDailyOfDay').mockReturnValue(false);

      const querySpy = jest.spyOn(DBConnection.instance, 'query');

      await DBDailiesDAO.achieve(userId, dailyType);

      expect(querySpy).not.toHaveBeenCalled();

      querySpy.mockRestore();
    });
  });
});
