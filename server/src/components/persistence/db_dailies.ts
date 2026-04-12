import { APIRejectReason, DailyType } from '../../shared/config/enums';
import { DAILY_DEFINITIONS } from '../../shared/config/dailies';
import DBConnection from './db_connector';
import DBProfilesDAO from './db_profiles';
import { isDailyOfDay } from '../utils/daily_selector';

// DBDaily interface with dynamic properties for all daily columns
export interface DBDaily {
  userId: number;
  [key: string]: boolean | number; // Dynamic properties for all daily columns (booleans) + userId (number)
}

export default class DBDailiesDAO {
  static async getByUserId(userId: number): Promise<DBDaily> {
    const result = await this.getBy('user_id = ?', [userId]);
    return result.length ? result[0] : Promise.reject(APIRejectReason.NotFound);
  }

  private static async getBy(whereClause: string, params: any[]): Promise<DBDaily[]> {
    // Generate SQL CASE statements dynamically from daily definitions
    const columnCases = DAILY_DEFINITIONS.map(
      daily =>
        `CASE WHEN ${daily.dbColumn} IS NULL OR ${daily.dbColumn} < CURRENT_DATE() THEN 0 ELSE 1 END AS ${daily.dbColumn}`
    ).join(', ');

    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT user_id, ${columnCases} FROM dailies WHERE ${whereClause}`,
      params
    );

    return queryResult.map(r => {
      const daily: DBDaily = {
        userId: Number(r.user_id)
      };

      // Dynamically add all daily properties
      DAILY_DEFINITIONS.forEach(dailyDef => {
        daily[dailyDef.dbColumn] = Boolean(r[dailyDef.dbColumn]);
      });

      return daily;
    });
  }

  static async create(userId: number) {
    await DBConnection.instance.query('INSERT INTO dailies (user_id) VALUES (?)', [userId]);
  }

  // Generic achieve method that works for any daily type
  static async achieve(userId: number, dailyType: DailyType) {
    const dailyDef = DAILY_DEFINITIONS.find(d => d.type === dailyType);

    // Only allow achieving dailies that are available today
    if (!isDailyOfDay(dailyType)) return;

    await this.getBy(
      `user_id = ? AND (${dailyDef.dbColumn} < current_date() OR ${dailyDef.dbColumn} IS NULL)`,
      [userId]
    ).then(b => {
      if (b.length) {
        DBConnection.instance.query(
          `UPDATE dailies SET ${dailyDef.dbColumn} = current_date() WHERE user_id = ?`,
          [userId]
        );
        DBProfilesDAO.increaseSol(userId, dailyDef.solReward);
      }
    });
  }

}
