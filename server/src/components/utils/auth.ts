import CardCollection from '../cards/collection/card_collection';
import { AuthLoginRequest, AuthRegisterRequest } from '../../shared/interfaces/rest_api';
import DBCredentialsDAO, { DBCredential, DBCredentialWithSessionToken } from '../persistence/db_credentials';
import DBProfilesDAO from '../persistence/db_profiles';
import DBDailiesDAO from '../persistence/db_dailies';
import DBDecksDAO from '../persistence/db_decks';
import DBMagicLinksDAO from '../persistence/db_magic_links';
import Mailer from './mailer';
import { APIRejectReason, MagicLinkType } from '../../shared/config/enums';

export default class Auth {
  static async checkUsernameExists(username: string): Promise<boolean> {
    return DBCredentialsDAO.getByUsername(username).then(
      () => true,
      reason => (reason == APIRejectReason.NotFound ? false : Promise.reject())
    );
  }
  static async checkEmailExists(email: string): Promise<boolean> {
    return DBCredentialsDAO.getByEmail(email).then(
      () => true,
      reason => (reason == APIRejectReason.NotFound ? false : Promise.reject())
    );
  }
  static async sendPasswordReset(usernameOrEmail: string) {
    const credential = await DBCredentialsDAO.getByUsername(usernameOrEmail).catch(reason =>
      reason == APIRejectReason.NotFound
        ? DBCredentialsDAO.getByEmail(usernameOrEmail)
        : Promise.reject(APIRejectReason.NotFound)
    );
    const uuid = await DBMagicLinksDAO.createPasswordReset(credential.userId);
    Mailer.sendPasswordReset(credential.email, credential.username, uuid);
  }
  static async sendEmailConfirmation(userId: number, username: string, newEmail: string) {
    const uuid = await DBMagicLinksDAO.createEmailConfirmation(userId, newEmail);
    Mailer.sendEmailConfirmation(newEmail, username, uuid);
  }
  static async activateAccount(resetId: string) {
    const userId = await DBMagicLinksDAO.getUserId(resetId, MagicLinkType.AccountActivation);
    await DBCredentialsDAO.activate(userId);
    await DBMagicLinksDAO.delete(resetId);
  }
  static async resetEmail(resetId: string) {
    const userId = await DBMagicLinksDAO.getUserId(resetId, MagicLinkType.EmailConfirmation);
    const value = await DBMagicLinksDAO.getValue(resetId, MagicLinkType.EmailConfirmation);
    if (!value) return Promise.reject();
    await DBCredentialsDAO.setEmail(userId, String(value));
    await DBMagicLinksDAO.delete(resetId);
  }
  static async resetPassword(resetId: string, password: string) {
    const userId = await DBMagicLinksDAO.getUserId(resetId, MagicLinkType.PasswordReset);
    await DBCredentialsDAO.setPassword(userId, password);
    await DBMagicLinksDAO.delete(resetId);
  }
  static async register(registrationData: AuthRegisterRequest): Promise<DBCredential> {
    await DBCredentialsDAO.create(
      registrationData.username,
      registrationData.password,
      registrationData.email
    );
    const credential = await DBCredentialsDAO.getByUsername(registrationData.username);
    if (!credential) return Promise.reject();
    DBProfilesDAO.create(credential.userId, registrationData.newsletter);
    DBDailiesDAO.create(credential.userId);
    CardCollection.starterDecks[registrationData.starterDeck]
      .map(c => c.id)
      .forEach(id => DBDecksDAO.create(id, credential.userId, true));
    const uuid = await DBMagicLinksDAO.createAccountActivation(credential.userId);
    Mailer.sendAccountActivation(credential.email, credential.username, uuid);
    return credential;
  }
  static async login(loginData: AuthLoginRequest): Promise<DBCredentialWithSessionToken> {
    const credential = await DBCredentialsDAO.getByUsername(loginData.username, loginData.password).catch(
      reason =>
        reason == APIRejectReason.NotFound
          ? DBCredentialsDAO.getByEmail(loginData.username, loginData.password)
          : Promise.reject(APIRejectReason.NotFound)
    );
    DBDailiesDAO.achieveLogin(credential.userId);
    const sessionToken = await DBCredentialsDAO.login(credential.userId);
    credential.sessionToken = sessionToken;
    return <DBCredentialWithSessionToken>credential;
  }
  static async logout(sessionToken: string) {
    await DBCredentialsDAO.invalidateSessionToken(sessionToken);
  }
}
