import DBConnection from './db_connector';

export interface DBDeck {
  cardInstanceId: number;
  cardId: number;
  inUse: boolean;
}

export default class DBDecksDAO {
  static async getByUserId(userId: number): Promise<DBDeck[]> {
    return this.getBy(`user_id = '${userId}'`);
  }
  static async setInUse(cardInstanceId: number, inUse: boolean) {
    await DBConnection.instance.query(
      `UPDATE decks SET in_use = ${inUse ? 1 : 0} WHERE card_instance_id = ${cardInstanceId}`,
    );
  }
  private static async getBy(whereClause: string): Promise<DBDeck[]> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT card_instance_id, card_id, in_use FROM decks WHERE ${whereClause}`,
    );
    return queryResult.map((r) => {
      return {
        cardInstanceId: Number(r.card_instance_id),
        cardId: Number(r.card_id),
        inUse: Boolean(r.in_use),
      };
    });
  }
  static async create(cardId: number, userId: number, inUse?: boolean) {
    DBConnection.instance.query(
      `INSERT INTO decks (card_id, user_id, in_use) VALUES (${cardId}, ${userId}, ${inUse ? 1 : 0})`,
    );
  }
}
