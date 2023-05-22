import { CardType } from "../../config/enums";
import Player from "../../game_state/player";
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
    immediateEffect(player: Player) {
        player.actionPool.pool.push(...this.oneTimeActionPool.pool);
    }
    getValidTargets(cardStacks: CardStack[]): CardStack[] {
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
    immediateEffect(player: Player) {
        player.drawCards(this.cardsToDraw);
    }
    getValidTargets(cardStacks: CardStack[]): CardStack[] {
        return this.onlyColonyTarget(cardStacks);
    }
}