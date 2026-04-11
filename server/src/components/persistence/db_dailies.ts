import { APIRejectReason } from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';
import DBConnection from './db_connector';
import DBProfilesDAO from './db_profiles';
import { isDailyOfDay } from '../utils/daily_selector';

export interface DBDaily {
  userId: number;
  login: boolean;
  victory: boolean;
  game: boolean;
  energy: boolean;
  ships: boolean;
  domination: boolean;
  destruction: boolean;
  control: boolean;
  juggernaut: boolean;
  stations: boolean;
  discard: boolean;
  colony: boolean;
  colossus: boolean;
}

export default class DBDailiesDAO {
  static async getByUserId(userId: number): Promise<DBDaily> {
    const result = await this.getBy('user_id = ?', [userId]);
    return result.length ? result[0] : Promise.reject(APIRejectReason.NotFound);
  }
  private static async getBy(whereClause: string, params: any[]): Promise<DBDaily[]> {
    const queryResult: any[] = await DBConnection.instance.query(
      'SELECT user_id, ' +
        'CASE WHEN login IS NULL OR login < CURRENT_DATE() THEN 0 ELSE 1 END AS login, ' +
        'CASE WHEN victory IS NULL OR victory < CURRENT_DATE() THEN 0 ELSE 1 END AS victory, ' +
        'CASE WHEN game IS NULL OR game < CURRENT_DATE() THEN 0 ELSE 1 END AS game, ' +
        'CASE WHEN energy IS NULL OR energy < CURRENT_DATE() THEN 0 ELSE 1 END AS energy, ' +
        'CASE WHEN ships IS NULL OR ships < CURRENT_DATE() THEN 0 ELSE 1 END AS ships, ' +
        'CASE WHEN domination IS NULL OR domination < CURRENT_DATE() THEN 0 ELSE 1 END AS domination, ' +
        'CASE WHEN destruction IS NULL OR destruction < CURRENT_DATE() THEN 0 ELSE 1 END AS destruction, ' +
        'CASE WHEN control IS NULL OR control < CURRENT_DATE() THEN 0 ELSE 1 END AS control, ' +
        'CASE WHEN juggernaut IS NULL OR juggernaut < CURRENT_DATE() THEN 0 ELSE 1 END AS juggernaut, ' +
        'CASE WHEN stations IS NULL OR stations < CURRENT_DATE() THEN 0 ELSE 1 END AS stations, ' +
        'CASE WHEN discard IS NULL OR discard < CURRENT_DATE() THEN 0 ELSE 1 END AS discard, ' +
        'CASE WHEN colony IS NULL OR colony < CURRENT_DATE() THEN 0 ELSE 1 END AS colony, ' +
        'CASE WHEN colossus IS NULL OR colossus < CURRENT_DATE() THEN 0 ELSE 1 END AS colossus ' +
        `FROM dailies WHERE ${whereClause}`,
      params
    );
    return queryResult.map(r => {
      return {
        userId: Number(r.user_id),
        login: Boolean(r.login),
        victory: Boolean(r.victory),
        game: Boolean(r.game),
        energy: Boolean(r.energy),
        ships: Boolean(r.ships),
        domination: Boolean(r.domination),
        destruction: Boolean(r.destruction),
        control: Boolean(r.control),
        juggernaut: Boolean(r.juggernaut),
        stations: Boolean(r.stations),
        discard: Boolean(r.discard),
        colony: Boolean(r.colony),
        colossus: Boolean(r.colossus)
      };
    });
  }
  static async create(userId: number) {
    await DBConnection.instance.query('INSERT INTO dailies (user_id) VALUES (?)', [userId]);
  }
  static async achieveLogin(userId: number) {
    if (isDailyOfDay('login')) await this.achieve(userId, 'login', rules.dailyEarnings.login);
  }
  static async achieveVictory(userId: number) {
    if (isDailyOfDay('victory')) await this.achieve(userId, 'victory', rules.dailyEarnings.victory);
  }
  static async achieveGame(userId: number) {
    if (isDailyOfDay('game')) await this.achieve(userId, 'game', rules.dailyEarnings.game);
  }
  static async achieveEnergy(userId: number) {
    if (isDailyOfDay('energy')) await this.achieve(userId, 'energy', rules.dailyEarnings.energy);
  }
  static async achieveShips(userId: number) {
    if (isDailyOfDay('ships')) await this.achieve(userId, 'ships', rules.dailyEarnings.ships);
  }
  static async achieveDomination(userId: number) {
    if (isDailyOfDay('domination')) await this.achieve(userId, 'domination', rules.dailyEarnings.domination);
  }
  static async achieveDestruction(userId: number) {
    if (isDailyOfDay('destruction')) await this.achieve(userId, 'destruction', rules.dailyEarnings.destruction);
  }
  static async achieveControl(userId: number) {
    if (isDailyOfDay('control')) await this.achieve(userId, 'control', rules.dailyEarnings.control);
  }
  static async achieveJuggernaut(userId: number) {
    if (isDailyOfDay('juggernaut')) await this.achieve(userId, 'juggernaut', rules.dailyEarnings.juggernaut);
  }
  static async achieveStations(userId: number) {
    if (isDailyOfDay('stations')) await this.achieve(userId, 'stations', rules.dailyEarnings.stations);
  }
  static async achieveDiscard(userId: number) {
    if (isDailyOfDay('discard')) await this.achieve(userId, 'discard', rules.dailyEarnings.discard);
  }
  static async achieveColony(userId: number) {
    if (isDailyOfDay('colony')) await this.achieve(userId, 'colony', rules.dailyEarnings.colony);
  }
  static async achieveColossus(userId: number) {
    if (isDailyOfDay('colossus')) await this.achieve(userId, 'colossus', rules.dailyEarnings.colossus);
  }
  private static async achieve(userId: number, daily: string, sol: number) {
    await this.getBy(`user_id = ? AND (${daily} < current_date() OR ${daily} IS NULL)`, [userId]).then(b => {
      if (b.length) {
        DBConnection.instance.query(`UPDATE dailies SET ${daily} = current_date() WHERE user_id = ?`, [
          userId
        ]);
        DBProfilesDAO.increaseSol(userId, sol);
      }
    });
  }
}
