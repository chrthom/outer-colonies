import DBDecksDAO from './db_decks';
import DBConnection from './db_connector';

describe('DBDecksDAO', () => {
  describe('setInUse', () => {
    let querySpy: jest.SpyInstance;

    beforeEach(() => {
      querySpy = jest.spyOn(DBConnection.instance, 'query');
      querySpy.mockResolvedValue({ affectedRows: 1 });
    });

    afterEach(() => {
      querySpy.mockRestore();
    });

    it('should scope the update to the card instance and the owning user', async () => {
      const userId = 123;
      const cardInstanceId = 456;

      await DBDecksDAO.setInUse(userId, cardInstanceId, true);

      expect(querySpy).toHaveBeenCalledWith(
        'UPDATE decks SET in_use = ? WHERE card_instance_id = ? AND user_id = ?',
        [true, cardInstanceId, userId]
      );
    });

    it('should pass the in-use flag through to the update', async () => {
      await DBDecksDAO.setInUse(123, 456, false);

      expect(querySpy).toHaveBeenCalledWith(
        'UPDATE decks SET in_use = ? WHERE card_instance_id = ? AND user_id = ?',
        [false, 456, 123]
      );
    });
  });
});
