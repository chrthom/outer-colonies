import { CardType, TacticDiscipline } from '../../config/enums';
import Player from '../../game_state/player';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class EconomyTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Science;
  }
}

export class Card110 extends EconomyTacticCard {
  private readonly damageToRepair = 3;
  constructor() {
    super(110, 'Nanobot Wolke', 4);
  }
  onUtilizaton(player: Player) {
    player.cardStacks
      .filter((cs) => cs.type == CardType.Hull)
      .forEach((cs) => {
        const numOfHullCards = cs.cards.filter((c) => c.type == CardType.Hull).length;
        cs.damage -= Math.min(this.damageToRepair * numOfHullCards, cs.damage);
      });
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}
