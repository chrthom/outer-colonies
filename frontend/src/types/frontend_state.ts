import { TurnPhase, Zone } from "./enums";

class FrontendOpponent {
    name!: string;
    handCardNo!: number;
}
class FrontendActions {
    hull!: number;
    equipment!: number;
    colony!: number;
    tactic!: number;
    orb!: number;
}

class FrontendHandCard {
    uuid!: string;
    cardId!: string;
    index!: number;
    playable!: boolean;
    validTargets!: Array<string>;
}

class FrontendCardStack {
    uuid!: string;
    cardIds!: Array<string>;
    zone!: Zone;
    index!: number;
    zoneCardsNum!: number;
    ownedByPlayer!: boolean;
    damage!: number;
}

export default class FrontendState {
    playerIsActive!: boolean;
    turnPhase!: TurnPhase;
    opponent!: FrontendOpponent;
    hand!: Array<FrontendHandCard>;
    cardStacks!: Array<FrontendCardStack>;
    remainingActions: FrontendActions;
}