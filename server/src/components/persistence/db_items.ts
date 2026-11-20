import { ItemType } from '../../shared/config/enums';
import DBConnection, { DBChangeResult } from './db_connector';

export interface DBItem {
  itemId: number;
  type: ItemType;
  message: string | null;
  content: string;
}

export interface DBItemBoxContent {
  type: string;
  value: number;
}

/** Raw `items` row as the MariaDB driver returns it (the bigint key arrives as BigInt). */
interface ItemRow {
  item_id: bigint;
  type: string;
  message: string | null;
  content: string;
}

export default class DBItemsDAO {
  static async getByUserId(userId: number): Promise<DBItem[]> {
    return this.getBy('user_id = ?', [userId]);
  }
  private static async getBy(whereClause: string, params: unknown[]): Promise<DBItem[]> {
    const rows = await DBConnection.instance.query<ItemRow[]>(
      `SELECT item_id, type, message, content FROM items WHERE ${whereClause}`,
      params
    );
    return rows.map(r => {
      return {
        itemId: Number(r.item_id),
        type: r.type == 'booster' ? ItemType.Booster : ItemType.Box,
        message: r.message,
        content: r.content
      };
    });
  }
  /**
   * Deletes an item and returns the number of deleted rows: 0 means the item no longer exists,
   * e.g. because it was concurrently opened, and callers must treat the delete as failed.
   * @param itemId id of the item to delete
   * @returns the number of deleted rows
   */
  static async delete(itemId: number): Promise<number> {
    const result = await DBConnection.instance.query<DBChangeResult>('DELETE FROM items WHERE item_id = ?', [
      itemId
    ]);
    return result.affectedRows;
  }
  static async createBooster(userId: number, boosterNo: number) {
    await this.create(userId, ItemType.Booster, String(boosterNo));
  }
  private static async create(userId: number, type: ItemType, content: string, message?: string) {
    await DBConnection.instance.query(
      'INSERT INTO items (user_id, type, content, message) VALUES (?, ?, ?, ?)',
      [userId, type, content, message]
    );
  }
}
