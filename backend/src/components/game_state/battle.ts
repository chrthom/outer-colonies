import Card from "../cards/card";
import CardStack from "../cards/card_stack";
import { BattleType } from "../config/enums";
import { rules } from "../config/rules";

export default class Battle {
    type!: BattleType;
    missionShips: Array<CardStack> = [];
    interveningShips: Array<CardStack> = [];
    downsidePriceCards: Array<Card> = [];
    upsidePriceCards: Array<Card> = [];
    range: number = rules.maxRange + 1;
    constructor(type: BattleType) {
        this.type = type;
    }
}
