export enum CardType {
    Colony = 'colony',
    Equipment = 'equipment',
    Hull = 'hull',
    Infrastructure = 'infrastructure',
    Tactic = 'tactic',
    Orb = 'orb'
}

export enum MsgTypeInbound {
    Attack = 'attack',
    Connect = 'connect',
    Disconnect = 'disconnect',
    Discard = 'discard',
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
