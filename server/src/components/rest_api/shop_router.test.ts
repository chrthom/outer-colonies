import { APIRejectReason } from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';
import DBConnection from '../persistence/db_connector';
import DBItemsDAO from '../persistence/db_items';
import DBProfilesDAO from '../persistence/db_profiles';
import { buyBooster } from './shop_router';

describe('ShopRouter', () => {
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
