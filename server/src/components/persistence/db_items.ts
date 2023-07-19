import { ItemType } from '../config/enums';
import DBConnection from './db_connector';

export interface DBItem {
  type: ItemType;
  message?: string,
  content: string
}

export interface DBItemBoxContent {
  type: string,
  value: number
}

export default class DBItemsDAO {
  static async getByUserId(userId: number): Promise<DBItem[]> {
    return this.getBy(`user_id = '${userId}'`);
  }
  private static async getBy(whereClause: string): Promise<DBItem[]> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT type, message, content FROM items WHERE ${whereClause}`,
    );
    return queryResult.map((r) => {
      return {
        type: r.type == 'deck' ? ItemType.Deck : ItemType.Box,
        message: r.message,
        content: r.content,
      };
    });
  }
  static async create(userId: number, type: ItemType, content: string, message?: string) {
    DBConnection.instance.query(
      `INSERT INTO decks (user_id, type, content${message ? ', message' : ''}) VALUES `
        + `(${userId}, '${type}', '${content}'${message ? `, '${message}'` : ''})`
    );
  }
}
