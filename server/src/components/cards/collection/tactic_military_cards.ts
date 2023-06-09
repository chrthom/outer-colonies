import { CardType } from "../../config/enums";
import Player from "../../game_state/player";
import ActionPool, { CardAction } from "../action_pool";
import CardStack from "../card_stack";
import TacticCard from "../types/tactic_card";

export class Card174 extends TacticCard {
    private readonly damageToRepair = 8;
    constructor() {
        super(
            174,
            'Feldreperaturen',
            1,
            false,
            false
        )
    }
    onUtilizaton(player: Player, target: CardStack) {
        target.damage -= Math.min(this.damageToRepair, target.damage);
    }
    getValidTargets(player: Player): CardStack[] {
        return player.cardStacks.filter(cs => cs.type() == CardType.Hull && cs.damage > 0);
    }
}

export class Card337 extends TacticCard {
    private oneTimeActionPool = new ActionPool(
        new CardAction(CardType.Equipment),
        new CardAction(CardType.Hull)
    );
    constructor() {
        super(
            337, 
            'Militärpioniere',
            1,
            false,
            false
        )
    }
    onUtilizaton(player: Player) {
        player.actionPool.push(...this.oneTimeActionPool.getPool().slice());
    }
    getValidTargets(player: Player): CardStack[] {
        return this.onlyColonyTarget(player.cardStacks);
    }
}

export class Card338 extends TacticCard {
    private readonly cardsToDraw = 2;
    constructor() {
        super(
            338,
            'Nachschub',
            1,
            false,
            false
        )
    }
    onUtilizaton(player: Player) {
        player.drawCards(this.cardsToDraw);
    }
    getValidTargets(player: Player): CardStack[] {
        return this.onlyColonyTarget(player.cardStacks);
    }
}
