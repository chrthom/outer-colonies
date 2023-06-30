import CardCollection from "../cards/collection/card_collection";
import { LoginRequest, RegisterRequest } from "../api/rest_api";
import DBConnection from "../persistence/db_connector";
import { v4 as uuidv4 } from 'uuid';
import { DBCredential } from "../persistence/db_objects";

export default class Auth {
    private dbConnection: DBConnection;
    constructor(dbConnection: DBConnection) {
        this.dbConnection = dbConnection;
    }
    async checkUsernameExists(username: string): Promise<boolean> {
        return await this.getUserByUsername(username) != null;
    }
    async checkEmailExists(email: string): Promise<boolean> {
        return await this.getUserByEmail(email) != null;
    }
    async register(registrationData: RegisterRequest): Promise<boolean> {
        await this.dbConnection.query('INSERT INTO credentials (username, password, email) VALUES '
            + `('${registrationData.username}', '${registrationData.password}', '${registrationData.email}')`);
        const credential = await this.getUserByUsername(registrationData.username);
        CardCollection.starterDecks[registrationData.startDeck].map(c => c.id).forEach(id => 
            this.dbConnection.query(`INSERT INTO decks (card_id, user_id) VALUES (${id}, ${credential.userId})`));
        return true;
    }
    async login(loginData: LoginRequest): Promise<string | null> {
        let credential = await this.getUserByUsername(loginData.username, loginData.password);
        if (!credential) credential = await this.getUserByEmail(loginData.username, loginData.password);
        if (credential) {
            const sessionToken = uuidv4();
            await this.dbConnection.query(
                'UPDATE credentials SET last_login = current_timestamp(), session_valid_until = current_timestamp() + INTERVAL 10 HOUR, '
                + `session_token = '${sessionToken}' WHERE user_id = ${credential.userId}`);
            return sessionToken;
        } else {
            return null;
        }
    }
    async getUserByUsername(username: string, password?: string): Promise<DBCredential | null> {
        const passwordQuery = password ? ` AND password = '${password}'` : '';
        return this.getUserIdByWhereClause(`username = '${username}'${passwordQuery}`);
    }
    async getUserByEmail(email: string, password?: string): Promise<DBCredential | null> {
        const passwordQuery = password ? ` AND password = '${password}'` : '';
        return this.getUserIdByWhereClause(`email = '${email}'${passwordQuery}`);
    }
    async getUserBySessionToken(sessionToken: string): Promise<DBCredential | null> {
        return this.getUserIdByWhereClause(
            `session_token = '${sessionToken}' AND session_valid_until > current_timestamp()`);
    }
    async getUserIdByWhereClause(whereClause: string): Promise<DBCredential | null> {
        const queryResult: any[] = await this.dbConnection.query(
            `SELECT user_id, username, session_token FROM credentials WHERE ${whereClause}`);
        return queryResult.length == 1 ? {
            userId: String(queryResult[0].user_id),
            username: String(queryResult[0].username),
            sessionToken: queryResult[0].session_token ? String(queryResult[0].session_token) : null
        } : null;
    }
}