import DBConnection from './db_connector';

export interface DBDaily {
  userId: number;
  login: boolean;
  victory: boolean;
  game: boolean;
  energy: boolean;
  ships: boolean;
}

export default class DBDailiesDAO {
  static async getByUserId(userId: number): Promise<DBDaily | undefined> {
    const result = await this.getBy(`user_id = '${userId}'`);
    return result.length ? result[0] : undefined;
  }
  private static async getBy(whereClause: string): Promise<DBDaily[]> {
    const queryResult: any[] = await DBConnection.instance.query(
      'SELECT user_id, '
      + 'CASE WHEN login IS NULL OR login < CURRENT_DATE() THEN 0 ELSE 1 END AS login '
      + 'CASE WHEN victory IS NULL OR victory < CURRENT_DATE() THEN 0 ELSE 1 END AS victory '
      + 'CASE WHEN game IS NULL OR game < CURRENT_DATE() THEN 0 ELSE 1 END AS game '
      + 'CASE WHEN energy IS NULL OR energy < CURRENT_DATE() THEN 0 ELSE 1 END AS energy '
      + 'CASE WHEN ships IS NULL OR ships < CURRENT_DATE() THEN 0 ELSE 1 END AS ships '
      + `FROM dailies WHERE ${whereClause}`,
    );
    return queryResult.map((r) => {
      return {
        userId: Number(r.user_id),
        login: Boolean(r.login),
        victory: Boolean(r.victory),
        game: Boolean(r.game),
        energy: Boolean(r.energy),
        ships: Boolean(r.ships)
      };
    });
  }
  static async create(userId: number) {
    return DBConnection.instance.query(
      `INSERT INTO dailies (user_id) VALUES (${userId})`,
    );
  }
}
