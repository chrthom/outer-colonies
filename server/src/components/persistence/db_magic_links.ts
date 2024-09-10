import { constants } from '../../shared/config/constants';
import { MagicLinkType } from '../../shared/config/enums';
import DBConnection from './db_connector';
import { v4 as uuidv4 } from 'uuid';

export default class DBMagicLinksDAO {
  static async createPasswordReset(userId: number): Promise<string> {
    await this.deleteForUserAndType(userId, MagicLinkType.PasswordReset);
    return this.create(userId, constants.magicLinkPasswordResetTTL, MagicLinkType.PasswordReset);
  }
  static async delete(id: number) {
    return DBConnection.instance.query(`DELETE FROM magic_links WHERE id = '${id}'`);
  }
  static async deleteForUserAndType(userId: number, type: MagicLinkType) {
    return DBConnection.instance.query(
      `DELETE FROM magic_links WHERE user_id = ${userId} AND type = '${type}'`
    );
  }
  private static async create(userId: number, ttlInHours: number, type: MagicLinkType): Promise<string> {
    const uuid = uuidv4();
    return DBConnection.instance
      .query(
        'INSERT INTO magic_links (id, user_id, type, valid_until) VALUES ' +
          `('${uuid}', ${userId}, '${type}', NOW() + INTERVAL ${ttlInHours} HOUR)`
      )
      .then(() => uuid);
  }
}
