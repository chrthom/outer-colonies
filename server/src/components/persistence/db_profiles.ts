import DBConnection from './db_connector';

export interface DBProfile {
  userId: number;
  sol: number;
}

export default class DBProfilesDAO {
  static async getByUserId(userId: number): Promise<DBProfile | undefined> {
    const result = await this.getBy(`user_id = '${userId}'`);
    return result.length ? result[0] : undefined;
  }
  private static async getBy(whereClause: string): Promise<DBProfile[]> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT user_id, sol FROM profiles WHERE ${whereClause}`,
    );
    return queryResult.map((r) => {
      return {
        userId: Number(r.user_id),
        sol: Number(r.sol)
      };
    });
  }
}
