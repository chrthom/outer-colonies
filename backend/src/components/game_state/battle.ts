import Card from "../cards/card";
import CardStack from "../cards/card_stack";
import { BattleType } from "../config/enums";

export default class Battle {
    type!: BattleType;
    missionShips: Array<CardStack> = [];
    interveneShips: Array<CardStack> = [];
    downsidePriceCards: Array<Card> = [];
    upsidePriceCards: Array<Card> = [];
    constructor(type: BattleType) {
        this.type = type;
    }
}
