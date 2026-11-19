import { APIRejectReason, DailyType } from '../../shared/config/enums';
import { DAILY_DEFINITIONS } from '../../shared/config/dailies';
import DBConnection from './db_connector';
import DBProfilesDAO from './db_profiles';
import { isDailyOfDay } from '../utils/daily_selector';

/**
 * A dailies DB row: dynamic boolean properties for all daily columns plus the
 * numeric userId.
 */
export interface DBDaily {
  userId: number;
  [key: string]: boolean | number | null;
}

/**
 * Raw `dailies` query row: the bigint key arrives as BigInt, every daily column is selected as a
 * 0/1 flag via a `CASE WHEN` expression (see {@link DBDailiesDAO.getBy}).
 */
interface DailyRow {
  user_id: bigint;
  [dbColumn: string]: number | bigint;
}

export default class DBDailiesDAO {
  static async getByUserId(userId: number): Promise<DBDaily> {
    const result = await this.getBy('user_id = ?', [userId]);
    return result.length ? result[0] : Promise.reject(APIRejectReason.NotFound);
  }

  private static async getBy(whereClause: string, params: unknown[]): Promise<DBDaily[]> {
    const columnCases = DAILY_DEFINITIONS.map(
      daily =>
        `CASE WHEN ${daily.dbColumn} IS NULL OR ${daily.dbColumn} < CURRENT_DATE() THEN 0 ELSE 1 END AS ${daily.dbColumn}`
    ).join(', ');

    const rows = await DBConnection.instance.query<DailyRow[]>(
      `SELECT user_id, ${columnCases} FROM dailies WHERE ${whereClause}`,
      params
    );

    return rows.map(r => {
      const dailyProperties = DAILY_DEFINITIONS.map(dailyDef => ({
        [dailyDef.dbColumn]: Boolean(r[dailyDef.dbColumn])
      }));

      return dailyProperties.reduce(
        (daily: DBDaily, prop) => {
          return { ...daily, ...prop };
        },
        { userId: Number(r.user_id) } as DBDaily
      );
    });
  }

  static async create(userId: number) {
    await DBConnection.instance.query('INSERT INTO dailies (user_id) VALUES (?)', [userId]);
  }

  /**
   * Marks a daily of any type as achieved for the given user, if it is offered
   * today and not yet achieved, and pays out its sol reward.
   */
  static async achieve(userId: number, dailyType: DailyType): Promise<void> {
    const dailyDef = DAILY_DEFINITIONS.find(d => d.type === dailyType);

    if (!dailyDef || !isDailyOfDay(dailyType)) return;

    const rows = await this.getBy(
      `user_id = ? AND (${dailyDef.dbColumn} < current_date() OR ${dailyDef.dbColumn} IS NULL)`,
      [userId]
    );
    if (rows.length) {
      await DBConnection.instance.query(
        `UPDATE dailies SET ${dailyDef.dbColumn} = current_date() WHERE user_id = ?`,
        [userId]
      );
      await DBProfilesDAO.increaseSol(userId, dailyDef.solReward);
    }
  }
}
