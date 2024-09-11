import CardCollection from '../cards/collection/card_collection';
import { AuthLoginRequest, AuthRegisterRequest } from '../../shared/interfaces/rest_api';
import DBCredentialsDAO, { DBCredential } from '../persistence/db_credentials';
import DBProfilesDAO from '../persistence/db_profiles';
import DBDailiesDAO from '../persistence/db_dailies';
import DBDecksDAO from '../persistence/db_decks';
import DBMagicLinksDAO from '../persistence/db_magic_links';
import Mailer from './mailer';
import { MagicLinkType } from '../../shared/config/enums';

type UsernameAndToken = [username: string, token: string];

export default class Auth {
  static async checkUsernameExists(username: string): Promise<boolean> {
    return (await DBCredentialsDAO.getByUsername(username)) != null;
  }
  static async checkEmailExists(email: string): Promise<boolean> {
    return (await DBCredentialsDAO.getByEmail(email)) != null;
  }
  static async sendPasswordReset(usernameOrEmail: string): Promise<void> {
    let credential = await DBCredentialsDAO.getByUsername(usernameOrEmail);
    credential ??= await DBCredentialsDAO.getByEmail(usernameOrEmail);
    if (!credential) return Promise.reject('not found');
    const uuid = await DBMagicLinksDAO.createPasswordReset(credential.userId);
    Mailer.sendPasswordReset(credential.email, credential.username, uuid);
  }
  static async resetPassword(resetId: string, password: string): Promise<void> {
    const userId = await DBMagicLinksDAO.getUserId(resetId, MagicLinkType.PasswordReset);
    await DBCredentialsDAO.setPassword(userId, password);
    DBMagicLinksDAO.delete(resetId);
  }
  static async register(registrationData: AuthRegisterRequest): Promise<DBCredential> {
    await DBCredentialsDAO.create(
      registrationData.username,
      registrationData.password,
      registrationData.email
    );
    const credential = await DBCredentialsDAO.getByUsername(registrationData.username);
    if (!credential) throw new Error('ERROR: New user could not be created');
    DBProfilesDAO.create(credential.userId, registrationData.newsletter);
    DBDailiesDAO.create(credential.userId);
    CardCollection.starterDecks[registrationData.starterDeck]
      .map(c => c.id)
      .forEach(id => DBDecksDAO.create(id, credential.userId, true));
    return credential;
  }
  static async login(loginData: AuthLoginRequest): Promise<UsernameAndToken> {
    let credential = await DBCredentialsDAO.getByUsername(loginData.username, loginData.password);
    credential ??= await DBCredentialsDAO.getByEmail(loginData.username, loginData.password);
    if (!credential) return Promise.reject();
    DBDailiesDAO.achieveLogin(credential.userId);
    const sessionToken = await DBCredentialsDAO.login(credential.userId);
    return [credential.username, sessionToken];
  }
  static async logout(sessionToken: string): Promise<boolean> {
    await DBCredentialsDAO.invalidateSessionToken(sessionToken);
    return true;
  }
}
