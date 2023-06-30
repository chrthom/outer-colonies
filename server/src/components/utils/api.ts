export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    startDeck: number;
}

export interface RegisterResponse {
    success: boolean;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    sessionToken: string;
}

export interface ExistsResponse {
    exists: boolean;
}
