export interface AuthRegisterRequest {
    username: string;
    password: string;
    email: string;
    startDeck: number;
}

export interface AuthRegisterResponse {
    success: boolean;
}

export interface AuthLoginRequest {
    username: string;
    password: string;
}

export interface AuthLoginResponse {
    success: boolean;
    sessionToken: string;
}

export interface AuthExistsResponse {
    exists: boolean;
}

export interface DeckCard {
    cardInstanceId: number;
    cardId: number;
}

export interface DeckListResponse {
    activeCards: DeckCard[],
    reserveCards: DeckCard[]
}