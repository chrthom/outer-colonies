import CardCollection from "../cards/collection/card_collection";
import { LoginRequest, RegisterRequest } from "../api/rest_api";
import DBConnection from "../persistence/db_connector";
import { v4 as uuidv4 } from 'uuid';
import DBCredentialsDAO from "../persistence/db_credentials";

export default class Auth {
    static async checkUsernameExists(username: string): Promise<boolean> {
        return await DBCredentialsDAO.getByUsername(username) != null;
    }
    static async checkEmailExists(email: string): Promise<boolean> {
        return await DBCredentialsDAO.getByEmail(email) != null;
    }
    static async register(registrationData: RegisterRequest): Promise<boolean> {
        await DBConnection.getInstance().query('INSERT INTO credentials (username, password, email) VALUES '
            + `('${registrationData.username}', '${registrationData.password}', '${registrationData.email}')`);
        const credential = await DBCredentialsDAO.getByUsername(registrationData.username);
        CardCollection.starterDecks[registrationData.startDeck].map(c => c.id).forEach(id => 
            DBConnection.getInstance().query(`INSERT INTO decks (card_id, user_id, in_use) VALUES (${id}, ${credential.userId}, 1)`));
        return true;
    }
    static async login(loginData: LoginRequest): Promise<string | null> {
        let credential = await DBCredentialsDAO.getByUsername(loginData.username, loginData.password);
        if (!credential) credential = await DBCredentialsDAO.getByEmail(loginData.username, loginData.password);
        if (credential) {
            const sessionToken = uuidv4();
            await DBConnection.getInstance().query(
                'UPDATE credentials SET last_login = current_timestamp(), session_valid_until = current_timestamp() + INTERVAL 10 HOUR, '
                + `session_token = '${sessionToken}' WHERE user_id = ${credential.userId}`);
            return sessionToken;
        } else {
            return null;
        }
    }
}