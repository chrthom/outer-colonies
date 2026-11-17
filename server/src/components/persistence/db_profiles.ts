import { APIRejectReason } from '../../shared/config/enums';
import DBConnection from './db_connector';

export interface DBProfile {
  userId: number;
  sol: number;
  newsletter: boolean;
}

export default class DBProfilesDAO {
  static async getByUserId(userId: number): Promise<DBProfile> {
    const result = await this.getBy('user_id = ?', [userId]);
    return result.length ? result[0] : Promise.reject(APIRejectReason.NotFound);
  }
  private static async getBy(whereClause: string, params: any[]): Promise<DBProfile[]> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT user_id, sol, newsletter FROM profiles WHERE ${whereClause}`,
      params
    );
    return queryResult.map(r => {
      return {
        userId: Number(r.user_id),
        sol: Number(r.sol),
        newsletter: Boolean(r.newsletter)
      };
    });
  }
  static async setNewsletter(userId: number, newsletter: boolean) {
    await DBConnection.instance.query('UPDATE profiles SET newsletter = ? WHERE user_id = ?', [
      newsletter,
      userId
    ]);
  }
  static async create(userId: number, newsletter: boolean) {
    await DBConnection.instance.query('INSERT INTO profiles (user_id, newsletter) VALUES (?, ?)', [
      userId,
      newsletter
    ]);
  }
  static async increaseSol(userId: number, sol: number) {
    await DBConnection.instance.query('UPDATE profiles SET sol = sol + ? WHERE user_id = ?', [sol, userId]);
  }
  /**
   * Atomically decreases the sol balance of a user with a single conditional update, so concurrent
   * decreases cannot drive the balance negative. Rejects with `APIRejectReason.ConditionNotMet`
   * if the balance is insufficient and with `APIRejectReason.NotFound` if the user is unknown.
   * @param userId id of the user whose balance is decreased
   * @param sol amount to subtract from the balance
   */
  static async decreaseSol(userId: number, sol: number) {
    const result: any = await DBConnection.instance.query(
      'UPDATE profiles SET sol = sol - ? WHERE user_id = ? AND sol >= ?',
      [sol, userId, sol]
    );
    if (result.affectedRows == 0) {
      // Distinguish an unknown user from an insufficient sol balance
      await this.getByUserId(userId);
      return Promise.reject(APIRejectReason.ConditionNotMet);
    }
  }
}
