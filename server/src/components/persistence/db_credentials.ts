import { APIRejectReason } from '../../shared/config/enums';
import DBConnection from './db_connector';
import { v4 as uuidv4 } from 'uuid';

export interface DBCredential {
  userId: number;
  username: string;
  email: string;
  sessionToken: string | null;
}

export interface DBCredentialWithSessionToken {
  userId: number;
  username: string;
  email: string;
  sessionToken: string;
}

export default class DBCredentialsDAO {
  static async getByUsername(username: string, password?: string): Promise<DBCredential> {
    const passwordQuery = password ? ` AND password = '${password}' AND activated = TRUE` : '';
    return this.getBy(`username = '${username}'${passwordQuery}`);
  }
  static async getByEmail(email: string, password?: string): Promise<DBCredential> {
    const passwordQuery = password ? ` AND password = '${password}' AND activated = TRUE` : '';
    return this.getBy(`email = '${email}'${passwordQuery}`);
  }
  static async getBySessionToken(sessionToken: string): Promise<DBCredentialWithSessionToken> {
    return this.getBy(`session_token = '${sessionToken}' AND session_valid_until > current_timestamp()`).then(
      r => ({
        userId: r.userId,
        username: r.username,
        email: r.email,
        sessionToken: r.sessionToken!
      })
    );
  }
  private static async getBy(whereClause: string): Promise<DBCredential> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT user_id, username, email, session_token FROM credentials WHERE ${whereClause}`
    );
    return queryResult.length == 1
      ? {
          userId: Number(queryResult[0].user_id),
          username: String(queryResult[0].username),
          email: String(queryResult[0].email),
          sessionToken: queryResult[0].session_token ? String(queryResult[0].session_token) : null
        }
      : Promise.reject(APIRejectReason.NotFound);
  }
  static async setEmail(userId: number, email: string) {
    await DBConnection.instance.query(
      `UPDATE credentials SET email = '${email}' WHERE user_id = '${userId}'`
    );
  }
  static async setPassword(userId: number, password: string) {
    await DBConnection.instance.query(
      `UPDATE credentials SET password = '${password}' WHERE user_id = '${userId}'`
    );
  }
  static async activate(userId: number) {
    await DBConnection.instance.query(`UPDATE credentials SET activated = TRUE WHERE user_id = '${userId}'`);
  }
  static async create(username: string, password: string, email: string) {
    await DBConnection.instance.query(
      `INSERT INTO credentials (username, password, email) VALUES ('${username}', '${password}', '${email}')`
    );
  }
  static async login(userId: number): Promise<string> {
    const sessionToken = uuidv4();
    return DBConnection.instance
      .query(
        'UPDATE credentials SET last_login = current_timestamp(), session_valid_until = current_timestamp() + INTERVAL 10 HOUR, ' +
          `session_token = '${sessionToken}' WHERE user_id = ${userId}`
      )
      .then(() => sessionToken);
  }
  static async invalidateSessionToken(sessionToken: string) {
    await DBConnection.instance.query(
      `UPDATE credentials SET session_token = NULL, session_valid_until = NULL WHERE session_token = '${sessionToken}'`
    );
  }
}
