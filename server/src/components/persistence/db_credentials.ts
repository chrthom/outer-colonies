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

/** Raw `credentials` row as the MariaDB driver returns it (the bigint key arrives as BigInt). */
interface CredentialRow {
  user_id: bigint;
  username: string;
  email: string;
  session_token: string | null;
}

export default class DBCredentialsDAO {
  static async getByUsername(username: string, password?: string): Promise<DBCredential> {
    const passwordQuery = password ? 'AND password = ? AND activated = TRUE' : '';
    const params = password ? [username, password] : [username];
    return this.getBy(`username = ? ${passwordQuery}`, params);
  }
  static async getByEmail(email: string, password?: string): Promise<DBCredential> {
    const passwordQuery = password ? 'AND password = ? AND activated = TRUE' : '';
    const params = password ? [email, password] : [email];
    return this.getBy(`email = ? ${passwordQuery}`, params);
  }
  static async getBySessionToken(sessionToken: string): Promise<DBCredentialWithSessionToken> {
    return this.getBy('session_token = ? AND session_valid_until > current_timestamp()', [sessionToken]).then(
      r => ({
        userId: r.userId,
        username: r.username,
        email: r.email,
        sessionToken: r.sessionToken!
      })
    );
  }
  private static async getBy(whereClause: string, params: unknown[]): Promise<DBCredential> {
    const rows = await DBConnection.instance.query<CredentialRow[]>(
      `SELECT user_id, username, email, session_token FROM credentials WHERE ${whereClause}`,
      params
    );
    return rows.length == 1
      ? {
          userId: Number(rows[0].user_id),
          username: rows[0].username,
          email: rows[0].email,
          sessionToken: rows[0].session_token || null
        }
      : Promise.reject(APIRejectReason.NotFound);
  }
  static async setEmail(userId: number, email: string) {
    await DBConnection.instance.query('UPDATE credentials SET email = ? WHERE user_id = ?', [email, userId]);
  }
  static async setPassword(userId: number, password: string) {
    await DBConnection.instance.query('UPDATE credentials SET password = ? WHERE user_id = ?', [
      password,
      userId
    ]);
  }
  static async activate(userId: number) {
    await DBConnection.instance.query('UPDATE credentials SET activated = TRUE WHERE user_id = ?', [userId]);
  }
  static async create(username: string, password: string, email: string) {
    await DBConnection.instance.query(
      'INSERT INTO credentials (username, password, email) VALUES (?, ?, ?)',
      [username, password, email]
    );
  }
  static async login(userId: number): Promise<string> {
    const sessionToken = uuidv4();
    return DBConnection.instance
      .query(
        'UPDATE credentials SET last_login = current_timestamp(), session_valid_until = current_timestamp() + INTERVAL 10 HOUR, session_token = ? WHERE user_id = ?',
        [sessionToken, userId]
      )
      .then(() => sessionToken);
  }
  static async invalidateSessionToken(sessionToken: string) {
    await DBConnection.instance.query(
      'UPDATE credentials SET session_token = NULL, session_valid_until = NULL WHERE session_token = ?',
      [sessionToken]
    );
  }
}
