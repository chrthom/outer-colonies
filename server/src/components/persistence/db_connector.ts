import mariadb, { Pool, PoolConnection, Prepare } from 'mariadb';
import { AsyncLocalStorage } from 'node:async_hooks';
import config from 'config';
import { logger } from '../utils/logger';

export default class DBConnection {
  private static con: DBConnection;
  private static readonly MAX_ACQUIRE_ATTEMPTS = 3;
  private transactionContext = new AsyncLocalStorage<PoolConnection>();
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
    const transactionConnection = this.transactionContext.getStore();
    if (transactionConnection) {
      // Inside a transaction every statement must run on the transaction connection and must not
      // be retried on another connection: an error aborts the whole transaction via rollback.
      return transactionConnection.prepare(query).then(q => q.execute(params));
    }
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
      logger.warn(`DB error ${err}`);
      if (!conn && attempt < DBConnection.MAX_ACQUIRE_ATTEMPTS) {
        return this.executeQuery(query, params, attempt + 1);
      }
      throw err;
    } finally {
      stmt?.close();
      await conn?.release();
    }
  }
  /**
   * Runs `f` inside a single database transaction: every `query` executed while `f` runs uses the
   * same pooled connection, the transaction is committed when `f` resolves and rolled back when it
   * rejects. If a transaction is already active in the current context, `f` joins it instead of
   * opening a nested one. The connection is always returned to the pool afterwards.
   * @param f callback executing the transactional statements; its resolution commits the transaction
   * @returns the resolved value of `f`
   */
  async transaction<T>(f: () => Promise<T>): Promise<T> {
    if (this.transactionContext.getStore()) return f();
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await this.transactionContext.run(conn, f);
      await conn.commit();
      return result;
    } catch (err) {
      logger.warn(`DB transaction error ${err}`);
      await conn.rollback().catch(rollbackErr => logger.warn(`DB rollback error ${rollbackErr}`));
      throw err;
    } finally {
      await conn.release().catch(releaseErr => logger.warn(`DB connection release error ${releaseErr}`));
    }
  }
  static get instance(): DBConnection {
    if (!DBConnection.con) DBConnection.con = new DBConnection();
    return DBConnection.con;
  }
}
