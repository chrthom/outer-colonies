import { APIRejectReason } from '../../shared/config/enums';
import DBConnection from './db_connector';

export interface DBProfile {
  userId: number;
  sol: number;
}

export default class DBProfilesDAO {
  static async getByUserId(userId: number): Promise<DBProfile> {
    const result = await this.getBy(`user_id = '${userId}'`);
    return result.length ? result[0] : Promise.reject(APIRejectReason.NotFound);
  }
  private static async getBy(whereClause: string): Promise<DBProfile[]> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT user_id, sol FROM profiles WHERE ${whereClause}`
    );
    return queryResult.map(r => {
      return {
        userId: Number(r.user_id),
        sol: Number(r.sol)
      };
    });
  }
  static async create(userId: number, newsletter: boolean) {
    await DBConnection.instance.query(
      `INSERT INTO profiles (user_id, newsletter) VALUES (${userId}, ${newsletter ? 1 : 0})`
    );
  }
  static async increaseSol(userId: number, sol: number) {
    await DBConnection.instance.query(`UPDATE profiles SET sol = sol + ${sol} WHERE user_id = ${userId}`);
  }
  static async decreaseSol(userId: number, sol: number) {
    const user = await this.getByUserId(userId);
    if (user.sol >= sol) {
      return this.increaseSol(userId, -sol);
    } else {
      return Promise.reject(APIRejectReason.ConditionNotMet);
    }
  }
}
