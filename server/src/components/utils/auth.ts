import { LoginRequest, RegisterRequest } from "./api";
import DBConnection from "./db_connector";

export default class Auth {
    private dbConnection: DBConnection;
    constructor(dbConnection: DBConnection) {
        this.dbConnection = dbConnection;
    }
    async checkUsernameExists(username: string): Promise<boolean> {
        const query: any[] = await this.dbConnection.query(`SELECT 1 FROM credentials WHERE username = '${username}'`);
        return query.length > 0;
    }
    async checkEmailExists(email: string): Promise<boolean> {
        const query: any[] = await this.dbConnection.query(`SELECT 1 FROM credentials WHERE email = '${email}'`);
        return query.length > 0;
    }
    async register(registrationData: RegisterRequest): Promise<boolean> {
        await this.dbConnection.query('INSERT INTO credentials (username, password, email) VALUES '
            + `('${registrationData.username}', '${registrationData.password}', '${registrationData.email}')`);
        return true;
    }
    async login(loginData: LoginRequest): Promise<boolean> {
        let query: any[] = await this.dbConnection.query(
            `SELECT 1 FROM credentials WHERE username = '${loginData.username}' AND password = '${loginData.password}'`
        );
        if (query.length > 0) {
            return true;
        } else {
            query = await this.dbConnection.query(
                `SELECT 1 FROM credentials WHERE email = '${loginData.username}' AND password = '${loginData.password}'`
            );
            return query.length > 0;
        }
    }
}