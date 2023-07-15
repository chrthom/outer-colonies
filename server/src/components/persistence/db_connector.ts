import mariadb from "mariadb";
import config from "config";

export default class DBConnection {
  private static con: DBConnection;
  pool!: mariadb.Pool;
  private constructor() {
    this.pool = mariadb.createPool({
      host: config.get("database.host"),
      port: config.get<number>("database.port"),
      database: config.get("database.database"),
      user: config.get("database.user"),
      password: config.has("database.password")
        ? config.get("database.password")
        : <string>process.env.DB_PASSWORD,
      connectionLimit: config.get<number>("database.connectionLimit"),
    });
  }
  async query<T>(query: string, noRetry?: boolean): Promise<T> {
    let conn: mariadb.PoolConnection;
    try {
      conn = await this.pool.getConnection();
      return conn.query(query);
    } catch (err) {
      console.log(`WARN: DB error ${err.code}`);
      if (err.code == "ER_GET_CONNECTION_TIMEOUT") {
        return this.query<T>(query);
      } else if (!noRetry) {
        return this.query(query, true);
      } else {
        throw err;
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
