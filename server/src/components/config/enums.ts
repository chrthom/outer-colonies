export enum BattleType {
  None = 'none',
  Mission = 'mission',
  Raid = 'raid',
}

export enum CardType {
  Colony = 'colony',
  Equipment = 'equipment',
  Hull = 'hull',
  Infrastructure = 'infrastructure',
  Tactic = 'tactic',
  Orb = 'orb',
}

export enum EventType {
  Attach = 'attach',
  Attack = 'attack',
  Discard = 'discard',
  Retract = 'retract',
  Tactic = 'tactic',
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
  Retract = 'retract',
}

export enum MsgTypeOutbound {
  CardRequest = 'card_request',
  Connect = 'connect',
  Matchmaking = 'matchmaking',
  State = 'state',
}

export enum TacticDiscipline {
  Economy = 'economy',
  Intelligence = 'intelligence',
  Military = 'military',
  Science = 'science',
}

export enum TurnPhase {
  Init = 'init',
  Start = 'start',
  Build = 'build',
  Combat = 'combat',
  End = 'end',
}

export enum Zone {
  Hand = 'hand',
  Colony = 'colony',
  Oribital = 'orbital',
  Neutral = 'neutral',
}
