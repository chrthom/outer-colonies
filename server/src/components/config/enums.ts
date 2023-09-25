export type CardSubtype = CardType | TacticDiscipline;

export enum BattleType {
  None = 'none',
  Mission = 'mission',
  Raid = 'raid'
}

export enum CardType {
  Colony = 'colony',
  Equipment = 'equipment',
  Hull = 'hull',
  Infrastructure = 'infrastructure',
  Tactic = 'tactic',
  Orb = 'orb'
}

export enum CardVolatility {
  Attach = 'attach',
  Instant = 'instant',
  SelfManaged = 'self_managed'
}

export enum DefenseType {
  Armour = 'armour',
  PointDefense = 'point_defense',
  Shield = 'shield'
}

export enum EventType {
  Attach = 'attach',
  Attack = 'attack',
  Discard = 'discard',
  Retract = 'retract',
  Tactic = 'tactic'
}

export enum ItemType {
  Box = 'box',
  Booster = 'booster'
}

export enum ItemBoxContentType {
  Card = 'card',
  Booster = 'booster',
  Sol = 'sol'
}

export enum GameResultType {
  Depletion = 'depletion',
  Destruction = 'destruction',
  Surrender = 'surrender'
}

export enum MsgTypeInbound {
  Attack = 'attack',
  Connect = 'connect',
  Disconnect = 'disconnect',
  Discard = 'discard',
  Handcard = 'handcard',
  Login = 'login',
  Ready = 'ready',
  Retract = 'retract'
}

export enum MsgTypeOutbound {
  CardRequest = 'card_request',
  Connect = 'connect',
  Matchmaking = 'matchmaking',
  State = 'state'
}

export enum Rarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare'
}

export enum TacticDiscipline {
  Intelligence = 'intelligence',
  Military = 'military',
  Science = 'science',
  Trade = 'trade'
}

export enum TurnPhase {
  Init = 'init',
  Start = 'start',
  Build = 'build',
  Combat = 'combat',
  End = 'end'
}

export enum Zone {
  Hand = 'hand',
  Colony = 'colony',
  Oribital = 'orbital',
  Neutral = 'neutral'
}
