import DBConnection from "./db_connector";

export interface DBCredential {
  userId: number;
  username: string;
  sessionToken: string | null;
}

export default class DBCredentialsDAO {
  static async getByUsername(
    username: string,
    password?: string,
  ): Promise<DBCredential | null> {
    const passwordQuery = password ? ` AND password = '${password}'` : "";
    return this.getBy(`username = '${username}'${passwordQuery}`);
  }
  static async getByEmail(
    email: string,
    password?: string,
  ): Promise<DBCredential | null> {
    const passwordQuery = password ? ` AND password = '${password}'` : "";
    return this.getBy(`email = '${email}'${passwordQuery}`);
  }
  static async getBySessionToken(
    sessionToken: string,
  ): Promise<DBCredential | null> {
    return this.getBy(
      `session_token = '${sessionToken}' AND session_valid_until > current_timestamp()`,
    );
  }
  private static async getBy(
    whereClause: string,
  ): Promise<DBCredential | null> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT user_id, username, session_token FROM credentials WHERE ${whereClause}`,
    );
    return queryResult.length == 1
      ? {
          userId: Number(queryResult[0].user_id),
          username: String(queryResult[0].username),
          sessionToken: queryResult[0].session_token
            ? String(queryResult[0].session_token)
            : null,
        }
      : null;
  }
}
