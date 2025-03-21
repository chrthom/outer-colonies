import DBConnection from './db_connector';

export interface DBDeck {
  cardInstanceId: number;
  cardId: number;
  inUse: boolean;
}

export default class DBDecksDAO {
  static async getByUserId(userId: number): Promise<DBDeck[]> {
    return this.getBy('user_id = ?', [userId]);
  }
  static async setInUse(cardInstanceId: number, inUse: boolean) {
    await DBConnection.instance.query('UPDATE decks SET in_use = ? WHERE card_instance_id = ?', [
      inUse,
      cardInstanceId
    ]);
  }
  private static async getBy(whereClause: string, params: any[]): Promise<DBDeck[]> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT card_instance_id, card_id, in_use FROM decks WHERE ${whereClause}`,
      params
    );
    return queryResult.map(r => {
      return {
        cardInstanceId: Number(r.card_instance_id),
        cardId: Number(r.card_id),
        inUse: Boolean(r.in_use)
      };
    });
  }
  static async create(cardId: number, userId: number, inUse?: boolean, tradeable?: boolean) {
    await DBConnection.instance.query(
      'INSERT INTO decks (card_id, user_id, in_use, tradeable) VALUES (?, ?, ?, ?)',
      [cardId, userId, inUse ?? false, tradeable ?? false]
    );
  }
}
