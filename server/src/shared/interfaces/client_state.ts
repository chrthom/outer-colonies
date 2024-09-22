import { EventType, BattleType, TurnPhase, Zone, GameResultType, InterventionType } from '../config/enums';

export interface ClientPlayer {
  actionPool: string[];
  deckSize: number;
  discardPileIds: number[];
  hand: ClientHandCard[];
  handCardLimit: number;
  hasToRetractCards: boolean;
  name: string;
}

export interface ClientPlannedAttack {
  sourceUUID: string;
  sourceIndex: number;
  targetUUID: string;
}

export interface ClientAttack extends ClientPlannedAttack {
  pointDefense: number;
  shield: number;
  armour: number;
  damage: number;
}

export interface ClientIntervention {
  type: InterventionType;
  attack?: ClientPlannedAttack;
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
  missionReady: boolean;
  interceptionReady: boolean;
  buildAttributes: ClientCardStackAttribute[];
  combatAttributes: ClientCardStackAttribute[];
}

export interface ClientDefenseIcon {
  icon: string;
  depleted: boolean;
}

export interface ClientCardStackAttribute {
  icon: string;
  warning?: boolean;
  value?: number;
}

export interface ClientHandCard {
  uuid: string;
  cardId: number;
  index: number;
  playable: boolean;
  validTargets: string[];
  ownedByPlayer: boolean;
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
  type?: GameResultType;
  sol: number;
}

export interface ClientState {
  battle: ClientBattle;
  cardStacks: ClientCardStack[];
  gameResult?: ClientGameResult;
  highlightCardUUID?: string;
  intervention?: ClientIntervention;
  opponent: ClientPlayer;
  player: ClientPlayer;
  playerIsActive: boolean;
  playerPendingAction: boolean;
  turnPhase: TurnPhase;
}

export const emptyClientState: ClientState = {
  battle: {
    type: BattleType.None,
    playerShipIds: [],
    opponentShipIds: [],
    priceCardIds: [],
    range: 0
  },
  cardStacks: [],
  opponent: {
    actionPool: [],
    deckSize: 0,
    discardPileIds: [],
    hand: [],
    handCardLimit: 0,
    hasToRetractCards: false,
    name: ''
  },
  player: {
    actionPool: [],
    deckSize: 0,
    discardPileIds: [],
    hand: [],
    handCardLimit: 0,
    hasToRetractCards: false,
    name: ''
  },
  playerIsActive: false,
  playerPendingAction: false,
  turnPhase: TurnPhase.Init
};
