import Card from "../cards/card";
import CardStack from "../cards/card_stack";

export default abstract class Battle {
    missionShips: Array<CardStack> = [];
    interveneShips: Array<CardStack> = [];
    downsidePriceCards: Array<Card> = [];
    upsidePriceCards: Array<Card> = [];
    isRaid(): boolean {
        return false;
    }
    isNoAction(): boolean {
        return this.missionShips.length == 0;
    }
    isBattle(): boolean {
        return this.missionShips.length > 0 && (!this.isRaid || this.interveneShips.length > 0);
    }
}

export class BattleNone extends Battle {}

export class BattleMission extends Battle {
    constructor(ships: Array<CardStack>, downsideCards: Array<Card>, upsideCards: Array<Card>) {
        super();
        this.missionShips = ships;
        this.downsidePriceCards = downsideCards;
        this.upsidePriceCards = upsideCards;
    }
}

export class BattleRaid extends Battle {
    constructor(ships: Array<CardStack>) {
        super();
        this.missionShips = ships;
    }
    isRaid(): boolean {
        return true;
    }
}
