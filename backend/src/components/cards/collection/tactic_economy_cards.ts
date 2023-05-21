import { CardType } from "../../config/enums";
import Match from "../../game_state/match";
import ActionPool, { CardAction } from "../action_pool";
import CardStack from "../card_stack";
import TacticCard from "../types/tactic_card";

export class Card141 extends TacticCard {
    private oneTimeActionPool = new ActionPool(
        new CardAction(CardType.Equipment),
        new CardAction(CardType.Hull),
        new CardAction(CardType.Infrastructure)
    );
    constructor() {
        super(
            141, 
            'Externe Arbeitskräfte',
            false,
            false
        )
    }
    immediateEffect(match: Match) {
        match.players[match.actionPendingByPlayerNo].actionPool.pool.push(...this.oneTimeActionPool.pool);
    }
    filterValidAttachTargets(cardStacks: CardStack[]): CardStack[] {
        return this.onlyColonyTarget(cardStacks);
    }
}

export class Card232 extends TacticCard {
    private readonly cardsToDraw = 2;
    constructor() {
        super(
            232, 
            'Warenlieferung',
            false,
            false
        )
    }
    immediateEffect(match: Match) {
        match.players[match.actionPendingByPlayerNo].drawCards(this.cardsToDraw);
    }
    filterValidAttachTargets(cardStacks: CardStack[]): CardStack[] {
        return this.onlyColonyTarget(cardStacks);
    }
}