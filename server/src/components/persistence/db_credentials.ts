import DBConnection from './db_connector';
import { v4 as uuidv4 } from 'uuid';

export interface DBCredential {
  userId: number;
  username: string;
  sessionToken: string | null;
}

export default class DBCredentialsDAO {
  static async getByUsername(username: string, password?: string): Promise<DBCredential | null> {
    const passwordQuery = password ? ` AND password = '${password}'` : '';
    return this.getBy(`username = '${username}'${passwordQuery}`);
  }
  static async getByEmail(email: string, password?: string): Promise<DBCredential | null> {
    const passwordQuery = password ? ` AND password = '${password}'` : '';
    return this.getBy(`email = '${email}'${passwordQuery}`);
  }
  static async getBySessionToken(sessionToken: string): Promise<DBCredential | null> {
    return this.getBy(`session_token = '${sessionToken}' AND session_valid_until > current_timestamp()`);
  }
  static async getBy(whereClause: string): Promise<DBCredential | null> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT user_id, username, session_token FROM credentials WHERE ${whereClause}`
    );
    return queryResult.length == 1
      ? {
          userId: Number(queryResult[0].user_id),
          username: String(queryResult[0].username),
          sessionToken: queryResult[0].session_token ? String(queryResult[0].session_token) : null
        }
      : null;
  }
  static async create(username: string, password: string, email: string) {
    return DBConnection.instance.query(
      `INSERT INTO credentials (username, password, email) VALUES ('${username}', '${password}', '${email}')`
    );
  }
  static async login(userId: number): Promise<string> {
    const sessionToken = uuidv4();
    await DBConnection.instance.query(
      'UPDATE credentials SET last_login = current_timestamp(), session_valid_until = current_timestamp() + INTERVAL 10 HOUR, ' +
        `session_token = '${sessionToken}' WHERE user_id = ${userId}`
    );
    return sessionToken;
  }
}
