import { CardType } from "../config/enums";

export class CardAction {
    possibleCardTypes!: Array<CardType>;
    depleted: boolean = false;
    constructor(...possibleCardTypes: Array<CardType>) {
        this.possibleCardTypes = possibleCardTypes;
    }
    canBeUsedFor(cardType: CardType): boolean {
        return this.possibleCardTypes.includes(cardType);
    }
    priority(): number {
        return this.possibleCardTypes.length;
    }
}

export default class ActionPool {
    pool!: Array<CardAction>;
    constructor(...cardActions: Array<CardAction>) {
        if (cardActions) this.pool = cardActions;
        else this.pool = [];
    }
    getActionsFor(cardType: CardType): Array<CardAction> {
        return this.pool.filter(ap => !ap.depleted && ap.canBeUsedFor(cardType));
    }
    hasActionFor(cardType: CardType): boolean {
        return this.getActionsFor(cardType).length > 0;
    }
    activate(cardType: CardType): boolean {
        const availablePools = this.getActionsFor(cardType);
        if (availablePools.length > 0) {
            availablePools.sort((a, b) => a.priority() - b.priority())[0].depleted = true;
            return true;
        } else {
            return false;
        }
    }
    combine(ap: ActionPool): ActionPool {
        return new ActionPool(...this.pool.concat(ap.pool));
    }
}