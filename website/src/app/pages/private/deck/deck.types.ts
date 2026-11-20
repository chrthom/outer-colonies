import { DeckCard, DeckCardProfile } from '@shared/interfaces/rest_api';
import { CardType, TacticDiscipline } from '@shared/config/enums';

/** A stack of identical cards in a deck box. */
export interface DeckCardStack extends DeckCard {
  numOfCards: number;
  // Ensure all DeckCard properties are explicitly available
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

/** Template for one column of the deck statistics table. */
export interface DeckStatisticsTemplate {
  title?: string;
  energyIcon?: boolean;
  get: (card: DeckCard) => number;
}

/** Aggregated used/provided values for one column of the deck statistics table. */
export interface DeckStatistics {
  title?: string;
  energyIcon?: boolean;
  used: number;
  provided: number;
}
