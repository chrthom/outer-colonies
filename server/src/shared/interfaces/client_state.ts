import { EventType, BattleType, TurnPhase, Zone, GameResultType, Intervention } from '../config/enums';

export interface ClientOpponent {
  name: string;
  handCardSize: number;
  deckSize: number;
  discardPileIds: number[];
}

export interface ClientAttack {
  sourceUUID: string;
  sourceIndex: number;
  targetUUID: string;
  pointDefense: number;
  shield: number;
  armour: number;
  damage: number;
}

export interface ClientIntervention {
  type: Intervention;
  attack?: ClientAttack;
  tacticCard?: number;
}

export interface ClientBattle {
  type: BattleType;
  playerShipIds: string[];
  opponentShipIds: string[];
  priceCardIds: number[];
  range: number;
  recentAttack?: ClientAttack;
}

export interface ClientCard {
  id: number;
  index: number;
  battleReady: boolean;
  retractable: boolean;
  insufficientEnergy: boolean;
}

export interface ClientCardStack {
  uuid: string;
  cards: ClientCard[];
  zone: Zone;
  index: number;
  zoneCardsNum: number;
  ownedByPlayer: boolean;
  damage: number;
  criticalDamage: boolean;
  missionReady: boolean;
  interceptionReady: boolean;
  defenseIcons: ClientDefenseIcon[];
}

export interface ClientDefenseIcon {
  icon: string;
  depleted: boolean;
}

export interface ClientHandCard {
  uuid: string;
  cardId: number;
  index: number;
  playable: boolean;
  validTargets: string[];
}

export interface ClientEvent {
  type: EventType;
  playerEvent: boolean;
  oldUUID?: string;
  newUUID?: string;
  target?: string;
}

export interface ClientGameResult {
  won: boolean;
  type: GameResultType;
  sol: number;
}

export interface ClientState {
  playerIsActive: boolean;
  playerPendingAction: boolean;
  turnPhase: TurnPhase;
  actionPool: string[];
  opponent: ClientOpponent;
  hand: ClientHandCard[];
  handCardLimit: number;
  deckSize: number;
  discardPileIds: number[];
  cardStacks: ClientCardStack[];
  battle: ClientBattle;
  intervention?: ClientIntervention;
  gameResult?: ClientGameResult;
  hasToRetractCards: boolean;
}
