import { APIRejectReason } from '../../shared/config/enums';
import DBConnection from './db_connector';
import DBProfilesDAO from './db_profiles';

describe('DBProfilesDAO', () => {
  describe('decreaseSol', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should decrease the balance with a single atomic conditional update', async () => {
      const querySpy = jest.spyOn(DBConnection.instance, 'query').mockResolvedValue({ affectedRows: 1 });

      await DBProfilesDAO.decreaseSol(42, 100);

      expect(querySpy).toHaveBeenCalledWith(
        'UPDATE profiles SET sol = sol - ? WHERE user_id = ? AND sol >= ?',
        [100, 42, 100]
      );
    });

    it('should reject with ConditionNotMet when the balance is insufficient', async () => {
      jest.spyOn(DBConnection.instance, 'query').mockResolvedValue({ affectedRows: 0 });
      const getByUserIdSpy = jest
        .spyOn(DBProfilesDAO, 'getByUserId')
        .mockResolvedValue({ userId: 42, sol: 10, newsletter: false });

      await expect(DBProfilesDAO.decreaseSol(42, 100)).rejects.toBe(APIRejectReason.ConditionNotMet);

      expect(getByUserIdSpy).toHaveBeenCalledWith(42);
    });

    it('should reject with NotFound when the user is unknown', async () => {
      jest.spyOn(DBConnection.instance, 'query').mockResolvedValue({ affectedRows: 0 });
      jest.spyOn(DBProfilesDAO, 'getByUserId').mockRejectedValue(APIRejectReason.NotFound);

      await expect(DBProfilesDAO.decreaseSol(42, 100)).rejects.toBe(APIRejectReason.NotFound);
    });
  });
});
