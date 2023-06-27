export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    startDeck: number;
}

export interface ExistsResponse {
    exists: boolean;
}