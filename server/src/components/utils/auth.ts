import { RegisterRequest } from "./api";
import DBConnection from "./db_connector";

export default class Auth {
    private dbConnection: DBConnection;
    constructor(dbConnection: DBConnection) {
        this.dbConnection = dbConnection;
    }
    async checkUsernameExists(username: string): Promise<boolean> {
        const v: any[] = await this.dbConnection.query(`SELECT 1 FROM credentials WHERE username = '${username}'`);
        return v.length > 0;
    }
    async checkEmailExists(email: string): Promise<boolean> {
        const v: any[] = await this.dbConnection.query(`SELECT 1 FROM credentials WHERE email = '${email}'`);
        return v.length > 0;
    }
    async register(registrationData: RegisterRequest): Promise<boolean> {
        const query = this.dbConnection.query('INSERT INTO credentials (username, password, email) VALUES '
            + `('${registrationData.username}', '${registrationData.password}', '${registrationData.email}')`);
        return query.then(_ => true);
    }
}