import { CardType } from "../../config/enums";
import Player from "../../game_state/player";
import CardStack from "../card_stack";
import TacticCard from "../types/tactic_card";

export class Card110 extends TacticCard {
    private readonly damageToRepair = 3;
    constructor() {
        super(
            110,
            'Nanobot Wolke',
            4,
            false,
            false
        )
    }
    onUtilizaton(player: Player) {
        player.cardStacks
            .filter(cs => cs.type() == CardType.Hull)
            .forEach(cs => {
                const numOfHullCards = cs.getCards().filter(c => c.type == CardType.Hull).length;
                cs.damage -= Math.min(this.damageToRepair * numOfHullCards, cs.damage);
            });
    }
    getValidTargets(player: Player): CardStack[] {
        return this.onlyColonyTarget(player.cardStacks);
    }
}
