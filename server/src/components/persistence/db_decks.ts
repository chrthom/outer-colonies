import DBConnection from './db_connector';

export interface DBDeck {
  cardInstanceId: number;
  cardId: number;
  inUse: boolean;
}

/** Raw `decks` row as the MariaDB driver returns it (the bigint key arrives as BigInt). */
interface DeckRow {
  card_instance_id: bigint;
  card_id: number;
  in_use: number;
}

export default class DBDecksDAO {
  static async getByUserId(userId: number): Promise<DBDeck[]> {
    return this.getBy('user_id = ?', [userId]);
  }
  /**
   * Sets the in-use flag of a card instance, restricted to the given user's rows so that
   * only the owning player can modify their own deck.
   * @param userId id of the user who must own the card instance
   * @param cardInstanceId id of the card instance to update
   * @param inUse true to add the card to the active deck, false to put it to reserve
   */
  static async setInUse(userId: number, cardInstanceId: number, inUse: boolean) {
    await DBConnection.instance.query(
      'UPDATE decks SET in_use = ? WHERE card_instance_id = ? AND user_id = ?',
      [inUse, cardInstanceId, userId]
    );
  }
  private static async getBy(whereClause: string, params: unknown[]): Promise<DBDeck[]> {
    const rows = await DBConnection.instance.query<DeckRow[]>(
      `SELECT card_instance_id, card_id, in_use FROM decks WHERE ${whereClause}`,
      params
    );
    return rows.map(r => {
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
