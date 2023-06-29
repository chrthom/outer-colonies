import CardCollection from "../cards/collection/card_collection";
import { LoginRequest, RegisterRequest } from "./api";
import DBConnection from "./db_connector";
import { v4 as uuidv4 } from 'uuid';

export default class Auth {
    private dbConnection: DBConnection;
    constructor(dbConnection: DBConnection) {
        this.dbConnection = dbConnection;
    }
    async checkUsernameExists(username: string): Promise<boolean> {
        return await this.getUserIdByUsername(username) > 0;
    }
    async checkEmailExists(email: string): Promise<boolean> {
        return await this.getUserIdByEmail(email) > 0;
    }
    async register(registrationData: RegisterRequest): Promise<boolean> {
        await this.dbConnection.query('INSERT INTO credentials (username, password, email) VALUES '
            + `('${registrationData.username}', '${registrationData.password}', '${registrationData.email}')`);
        const userId = await this.getUserIdByUsername(registrationData.username);
        CardCollection.starterDecks[registrationData.startDeck].map(c => c.id).forEach(id => 
            this.dbConnection.query(`INSERT INTO decks (card_id, user_id) VALUES (${id}, ${userId})`));
        return true;
    }
    async login(loginData: LoginRequest): Promise<boolean> {
        let userId = await this.getUserIdByWhereClause(`username = '${loginData.username}' AND password = '${loginData.password}'`);
        if (userId == -1) {
            userId = await this.getUserIdByWhereClause(`email = '${loginData.username}' AND password = '${loginData.password}'`);
        }
        const sessionToken = uuidv4();
        await this.dbConnection.query(
            'UPDATE credentials SET last_login = current_timestamp(), session_valid_until = current_timestamp() + INTERVAL 10 HOUR, '
            + `session_token = '${sessionToken}' WHERE user_id = ${userId}`);
        return userId > 0;
    }
    private async getUserIdByUsername(username: string): Promise<number> {
        return this.getUserIdByWhereClause(`username = '${username}'`);
    }
    private async getUserIdByEmail(email: string): Promise<number> {
        return this.getUserIdByWhereClause(`email = '${email}'`);
    }
    private async getUserIdByWhereClause(whereClause: string): Promise<number> {
        const queryResult: any[] = await this.dbConnection.query(`SELECT user_id FROM credentials WHERE ${whereClause}`);
        return queryResult.length == 1 ? queryResult[0].user_id : -1;
    }
}