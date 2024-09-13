import mariadb, { SqlError } from 'mariadb';
import config from 'config';

export default class DBConnection {
  private static con: DBConnection;
  pool: mariadb.Pool;
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
    let conn: mariadb.PoolConnection | undefined;
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
  static get instance(): DBConnection {
    if (!DBConnection.con) DBConnection.con = new DBConnection();
    return DBConnection.con;
  }
}
