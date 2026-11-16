import mariadb, { Pool, PoolConnection, Prepare } from 'mariadb';
import config from 'config';

export default class DBConnection {
  private static con: DBConnection;
  private static readonly MAX_ACQUIRE_ATTEMPTS = 3;
  pool: Pool;
  private constructor() {
    this.pool = mariadb.createPool({
      host: config.get('database.host'),
      port: config.get<number>('database.port'),
      database: config.get('database.database'),
      user: config.get('database.user'),
      password: <string>process.env['DB_PASSWORD'],
      connectionLimit: config.get<number>('database.connectionLimit')
    });
  }

  /**
   * Executes a query as prepared statement on a connection from the pool,
   * releasing connection and statement only after the query has finished.
   *
   * @param query SQL statement to execute
   * @param params parameters to bind to the prepared statement
   * @returns the result of the executed statement
   */
  async query(query: string, params: any[]): Promise<any> {
    return this.executeQuery(query, params, 1);
  }

  /**
   * Executes a query, retrying connection acquisition with at most
   * {@link DBConnection.MAX_ACQUIRE_ATTEMPTS} total acquisition attempts.
   *
   * @param query SQL statement to execute
   * @param params parameters to bind to the prepared statement
   * @param attempt current connection acquisition attempt (1-based)
   * @returns the result of the executed statement
   */
  private async executeQuery(query: string, params: any[], attempt: number): Promise<any> {
    let conn: PoolConnection | undefined;
    let stmt: Prepare | undefined;
    try {
      conn = await this.pool.getConnection();
      stmt = await conn.prepare(query);
      return await stmt.execute(params);
    } catch (err) {
      console.log(`WARN: DB error ${err}`);
      if (!conn && attempt < DBConnection.MAX_ACQUIRE_ATTEMPTS) {
        return this.executeQuery(query, params, attempt + 1);
      }
      throw err;
    } finally {
      stmt?.close();
      await conn?.release();
    }
  }

  static get instance(): DBConnection {
    if (!DBConnection.con) DBConnection.con = new DBConnection();
    return DBConnection.con;
  }
}
