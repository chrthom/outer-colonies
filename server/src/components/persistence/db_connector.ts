import mariadb from 'mariadb';

export default class DBConnection {
    private static con: DBConnection; 
    pool!: mariadb.Pool;
    private constructor() {
        this.pool = mariadb.createPool({
            host: '192.168.0.2',
            port: 3307,
            database: 'outercolonies',
            user:'outercolonies',
            password: '}MrM<wiT,w?Eh&CS)27,',
            connectionLimit: 20
        });
    }
    async query<T>(query: string, noRetry?: boolean): Promise<T> {
        let conn: mariadb.PoolConnection;
        try {
          conn = await this.pool.getConnection();
          return conn.query(query);
        } catch (err) {
          console.log(`WARN: DB error ${err.code}`);
          if (err.code == 'ER_GET_CONNECTION_TIMEOUT') {
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
