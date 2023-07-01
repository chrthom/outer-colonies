import DBConnection from "./db_connector";

export interface DBDeck {
    cardInstanceId: number;
    cardId: number;
    inUse: boolean;
}

export default class DBDecksDAO {
    static async getByUserId(userId: number): Promise<DBDeck[]> {
        return this.getBy(`user_id = '${userId}'`);
    }
    private static async getBy(whereClause: string): Promise<DBDeck[]> {
        const queryResult: any[] = await DBConnection.getInstance().query(
            `SELECT card_instance_id, card_id, in_use FROM decks WHERE ${whereClause}`);
        return queryResult.map(r => {
            return {
                cardInstanceId: Number(r.card_instance_id),
                cardId: Number(r.card_id),
                inUse: Boolean(r.in_use)
            };
        });
    }
}
