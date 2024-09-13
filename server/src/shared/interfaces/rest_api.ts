import { CardType, TacticDiscipline } from '../config/enums';

export interface AuthRegisterRequest {
  username: string;
  password: string;
  email: string;
  starterDeck: number;
  newsletter: boolean;
}

export interface AuthLoginRequest {
  username: string;
  password: string;
}

export interface AuthPasswordRequest {
  password: string;
}

export interface AuthEmailRequest {
  email: string;
}

export interface GenericResponse {
  status: number;
  message?: string;
}

export interface AuthRegistrationResponse {
  id: number;
  username: string;
}

export interface AuthLoginResponse {
  sessionToken: string;
  username: string;
  email: string;
}

export interface AuthExistsResponse {
  exists: boolean;
}

export interface DeckCard {
  id: number;
  inUse: boolean;
  cardId: number;
  name: string;
  rarity: number;
  type: CardType;
  canAttack: boolean;
  discipline?: TacticDiscipline;
  hp?: number;
  damage?: number;
  range?: number;
  defense?: string;
  profile: DeckCardProfile;
}

export interface DeckCardProfile {
  energy: number;
  theta: number;
  xi: number;
  phi: number;
  omega: number;
  delta: number;
  psi: number;
}

export interface DeckListResponse {
  cards: DeckCard[];
}

export interface ProfileGetResponse {
  sol: number;
  newsletter: boolean;
}

export interface DailyGetResponse {
  login: boolean;
  victory: boolean;
  game: boolean;
  energy: boolean;
  ships: boolean;
}

export interface ItemListResponse {
  boxes: ItemListResponseBox[];
  boosters: ItemListResponseBooster[];
}

interface ItemListResponseElement {
  itemId: number;
}

export interface ItemListResponseBox extends ItemListResponseElement {
  message?: string;
  sol: number[];
  cards: number[];
  boosters: number[];
}

export interface ItemListResponseBooster extends ItemListResponseElement {
  no: number;
}
