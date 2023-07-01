import DBConnection from "./db_connector";

export interface DBCredential {
    userId: string;
    username: string;
    sessionToken: string | null;
}

export default class DBCredentialDAO {
    static async getByUsername(username: string, password?: string): Promise<DBCredential | null> {
        const passwordQuery = password ? ` AND password = '${password}'` : '';
        return DBCredentialDAO.getByWhereClause(`username = '${username}'${passwordQuery}`);
    }
    static async getByEmail(email: string, password?: string): Promise<DBCredential | null> {
        const passwordQuery = password ? ` AND password = '${password}'` : '';
        return DBCredentialDAO.getByWhereClause(`email = '${email}'${passwordQuery}`);
    }
    static async getBySessionToken(sessionToken: string): Promise<DBCredential | null> {
        return DBCredentialDAO.getByWhereClause(
            `session_token = '${sessionToken}' AND session_valid_until > current_timestamp()`);
    }
    static async getByWhereClause(whereClause: string): Promise<DBCredential | null> {
        const queryResult: any[] = await DBConnection.getInstance().query(
            `SELECT user_id, username, session_token FROM credentials WHERE ${whereClause}`);
        return queryResult.length == 1 ? {
            userId: String(queryResult[0].user_id),
            username: String(queryResult[0].username),
            sessionToken: queryResult[0].session_token ? String(queryResult[0].session_token) : null
        } : null;
    }
}
