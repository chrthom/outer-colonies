import { APIRejectReason, DailyType, ItemBoxContentType, ItemType } from '../shared/config/enums';
import { DAILY_DEFINITIONS } from '../shared/config/dailies';
import { rules } from '../shared/config/rules';
import DBConnection from './persistence/db_connector';
import DBDailiesDAO from './persistence/db_dailies';
import DBDecksDAO from './persistence/db_decks';
import DBItemsDAO from './persistence/db_items';
import DBProfilesDAO from './persistence/db_profiles';
import CardCollection from './cards/collection/card_collection';
import { buyBooster, getDailies, getDailiesResponse, INVALID_ITEM_TYPE, openItem } from './rest_api';
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
