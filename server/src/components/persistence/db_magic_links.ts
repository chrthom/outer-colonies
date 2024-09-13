import { constants } from '../../shared/config/constants';
import { APIRejectReason, MagicLinkType } from '../../shared/config/enums';
import DBConnection from './db_connector';
import { v4 as uuidv4 } from 'uuid';

export default class DBMagicLinksDAO {
  static async createAccountActivation(userId: number): Promise<string> {
    await this.deleteForUserAndType(userId, MagicLinkType.AccountActivation);
    return this.create(userId, MagicLinkType.AccountActivation);
  }
  static async createEmailConfirmation(userId: number, email: string): Promise<string> {
    await this.deleteForUserAndType(userId, MagicLinkType.EmailConfirmation);
    return this.create(userId, MagicLinkType.EmailConfirmation, email);
  }
  static async createPasswordReset(userId: number): Promise<string> {
    await this.deleteForUserAndType(userId, MagicLinkType.PasswordReset);
    return this.create(userId, MagicLinkType.PasswordReset);
  }
  static async delete(id: string) {
    return DBConnection.instance.query(`DELETE FROM magic_links WHERE id = '${id}'`);
  }
  static async deleteForUserAndType(userId: number, type: MagicLinkType) {
    return DBConnection.instance.query(
      `DELETE FROM magic_links WHERE user_id = ${userId} AND type = '${type}'`
    );
  }
  static async getUserId(id: string, type: MagicLinkType): Promise<number> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT user_id FROM magic_links WHERE id = '${id}' AND type = '${type}' AND valid_until >= NOW()`
    );
    return queryResult.length == 1 ? queryResult[0].user_id : Promise.reject(APIRejectReason.NotFound);
  }
  static async getValue(id: string, type: MagicLinkType): Promise<string | null> {
    const queryResult: any[] = await DBConnection.instance.query(
      `SELECT value FROM magic_links WHERE id = '${id}' AND type = '${type}' AND valid_until >= NOW()`
    );
    return queryResult.length == 1 ? queryResult[0].value : Promise.reject(APIRejectReason.NotFound);
  }
  private static async create(userId: number, type: MagicLinkType, value?: any): Promise<string> {
    const uuid = uuidv4();
    return DBConnection.instance
      .query(
        'INSERT INTO magic_links (id, user_id, type, value, valid_until) VALUES ' +
          `('${uuid}', ${userId}, '${type}', ${value ? `'${value}'` : null}, NOW() + INTERVAL ${constants.magicLinkTTL} HOUR)`
      )
      .then(() => uuid);
  }
}
