import CardCollection from '../cards/collection/card_collection';
import { AuthLoginRequest, AuthRegisterRequest } from '../shared_interfaces/rest_api';
import DBCredentialsDAO from '../persistence/db_credentials';
import { rules } from '../config/rules';
import DBProfilesDAO from '../persistence/db_profiles';
import DBDailiesDAO from '../persistence/db_dailies';
import DBDecksDAO from '../persistence/db_decks';

export default class Auth {
  static async checkUsernameExists(username: string): Promise<boolean> {
    return (await DBCredentialsDAO.getByUsername(username)) != null;
  }
  static async checkEmailExists(email: string): Promise<boolean> {
    return (await DBCredentialsDAO.getByEmail(email)) != null;
  }
  static async register(registrationData: AuthRegisterRequest): Promise<boolean> {
    await DBCredentialsDAO.create(registrationData.username, registrationData.password, registrationData.email);
    const credential = await DBCredentialsDAO.getByUsername(registrationData.username);
    DBProfilesDAO.create(credential.userId);
    DBDailiesDAO.create(credential.userId);
    CardCollection.starterDecks[registrationData.startDeck]
      .map((c) => c.id)
      .forEach((id) => DBDecksDAO.create(id, credential.userId, true));
    return true;
  }
  static async login(loginData: AuthLoginRequest): Promise<string | null> {
    let credential = await DBCredentialsDAO.getByUsername(loginData.username, loginData.password);
    if (!credential) credential = await DBCredentialsDAO.getByEmail(loginData.username, loginData.password);
    if (credential) {
      DBDailiesDAO.achieveLogin(credential.userId); ////
      return DBCredentialsDAO.login(credential.userId);
    } else {
      return null;
    }
  }
}
