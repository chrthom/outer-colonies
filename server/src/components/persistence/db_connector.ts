import mariadb, { SqlError, Pool, PoolConnection } from 'mariadb';
import { AsyncLocalStorage } from 'node:async_hooks';
import config from 'config';

export default class DBConnection {
  private static con: DBConnection;
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
  async query(query: string, params: any[], noRetry?: boolean): Promise<any> {
    const transactionConnection = this.transactionContext.getStore();
    if (transactionConnection) {
      // Inside a transaction every statement must run on the transaction connection and must not
      // be retried on another connection: an error aborts the whole transaction via rollback.
      return transactionConnection.prepare(query).then(q => q.execute(params));
    }
    let conn: PoolConnection | undefined;
    try {
      conn = await this.pool.getConnection();
      return conn.prepare(query).then(q => q.execute(params));
    } catch (err) {
      console.log(`WARN: DB error ${err}`);
      if (err instanceof SqlError && err.code == 'ER_GET_CONNECTION_TIMEOUT') {
        return this.query(query, params);
      } else if (!noRetry) {
        return this.query(query, params, true);
      } else {
        return Promise.reject(err);
      }
    } finally {
      if (conn) conn.end();
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
      console.log(`WARN: DB transaction error ${err}`);
      await conn.rollback().catch(rollbackErr => console.log(`WARN: DB rollback error ${rollbackErr}`));
      throw err;
    } finally {
      await conn
        .release()
        .catch(releaseErr => console.log(`WARN: DB connection release error ${releaseErr}`));
    }
  }
  static get instance(): DBConnection {
    if (!DBConnection.con) DBConnection.con = new DBConnection();
    return DBConnection.con;
  }
}
