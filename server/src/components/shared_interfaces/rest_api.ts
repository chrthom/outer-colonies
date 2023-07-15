import { CardType } from "../config/enums";

export interface AuthRegisterRequest {
  username: string;
  password: string;
  email: string;
  startDeck: number;
}

export interface AuthRegisterResponse {
  // ISSUE #91: Remove and just send HTTP status
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
  // ISSUE #91: Remove and just send HTTP status
  exists: boolean;
}

export interface DeckCard {
  id: number;
  cardId: number;
  name: string;
  rarity: number;
  type: CardType;
  inUse: boolean;
}

export interface DeckListResponse {
  cards: DeckCard[];
}
