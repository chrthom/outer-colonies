import mariadb from 'mariadb';

export default class DBConnection {
    private static instance: DBConnection; 
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
    async query<T>(query: string): Promise<T> {
        let conn: mariadb.PoolConnection;
        try {
          conn = await this.pool.getConnection();
          return conn.query(query);
        } catch (err) {
          throw err;
        } finally {
          if (conn) conn.end();
        }
    }
    static getInstance(): DBConnection {
        if (!DBConnection.instance) DBConnection.instance = new DBConnection();
        return DBConnection.instance;
    }
}
