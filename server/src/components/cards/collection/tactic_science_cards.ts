import { CardType, CardVolatility, TacticDiscipline } from '../../config/enums';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class ScienceTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Science;
  }
}

export class Card110 extends ScienceTacticCard {
  private readonly damageToRepair = 3;
  constructor() {
    super(110, 'Nanobot Wolke', 4);
  }
  onEnterGame(player: Player) {
    player.cardStacks
      .filter(cs => cs.type == CardType.Hull)
      .forEach(cs => {
        const numOfHullCards = cs.cards.filter(c => c.type == CardType.Hull).length;
        cs.damage -= Math.min(this.damageToRepair * numOfHullCards, cs.damage);
      });
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card144 extends ScienceTacticCard {
  constructor() {
    super(144, 'Kalte Fusion', 2, {
      energy: 1
    });
  }
  override get volatility(): CardVolatility {
    return CardVolatility.SelfManaged;
  }
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack) {
    let handCard: CardStack;
    if (target.type == CardType.Colony) handCard = player.hand.find(cs => cs.card.name == 'Kraftwerk');
    if (!handCard) handCard = player.hand.find(cs => cs.card.name == 'Fusionsreaktor');
    handCard.attach(cardStack);
    player.playHandCard(handCard, target, true);
  }
  getValidTargets(player: Player): CardStack[] {
    const validTargetsWithDuplicates = player.hand
      .filter(cs => cs.card.name == 'Fusionsreaktor' || cs.card.name == 'Kraftwerk')
      .flatMap(cs => cs.card.getValidTargets(player));
    return [...new Map(validTargetsWithDuplicates.map(cs => [cs.uuid, cs])).values()];
  }
}

export class Card316 extends ScienceTacticCard {
  private oneTimeActionPool = new ActionPool(
    new CardAction(TacticDiscipline.Military),
    new CardAction(TacticDiscipline.Military),
    new CardAction(TacticDiscipline.Military),
    new CardAction(TacticDiscipline.Military)
  );
  constructor() {
    super(316, 'Militärforschung', 3);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}
