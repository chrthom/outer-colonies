import { CardType } from '../config/enums';
import { DBProfile } from '../persistence/db_profiles';

export interface AuthRegisterRequest {
  username: string;
  password: string;
  email: string;
  startDeck: number;
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

export interface ProfileGetResponse extends DBProfile {}
