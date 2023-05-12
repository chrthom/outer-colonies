export enum CardType {
    Hull = 'hull',
    Equipment = 'equipment',
    Colony = 'colony',
    Tactic = 'tactic',
    Orb = 'orb'
}

export enum MsgTypeInbound {
    Connection = 'connection',
    Disconnect = 'disconnect',
    Handcard = 'handcard',
    Login = 'login',
    Ready = 'ready'
}

export enum MsgTypeOutbound {
    Matchmaking = 'matchmaking',
    State = 'state',
    CardRequest = 'card_request'
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

export enum BattleType {
    None = 'none',
    Mission = 'mission',
    Raid = 'raid'
}
