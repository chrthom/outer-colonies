import { CardType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class EconomyTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Trade;
  }
}

export class Card141 extends EconomyTacticCard {
  private oneTimeActionPool = new ActionPool(
    new CardAction(CardType.Equipment),
    new CardAction(CardType.Hull),
    new CardAction(CardType.Infrastructure)
  );
  constructor() {
    super(141, 'Externe Arbeitskräfte', 2);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card165 extends EconomyTacticCard {
  private readonly cardsToDrawPerPsiSocket = 1;
  constructor() {
    super(165, 'Konvoi', 1);
  }
  onEnterGame(player: Player) {
    const freePsiSockets = this.calcFreePsiSockets(player);
    if (freePsiSockets) {
      player.drawCards(freePsiSockets * this.cardsToDrawPerPsiSocket);
    }
  }
  getValidTargets(player: Player): CardStack[] {
    return this.calcFreePsiSockets(player) > 0 ? this.onlyColonyTarget(player.cardStacks) : [];
  }
  private calcFreePsiSockets(player: Player): number {
    return player.cardStacks
      .filter(cs => cs.zone == Zone.Oribital)
      .map(cs => cs.profile)
      .filter(p => p.speed >= 2 && p.psi > 0)
      .map(p => p.psi)
      .reduce((psi1, psi2) => psi1 + psi2, 0);
  }
}

export class Card232 extends EconomyTacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(232, 'Warenlieferung', 1);
  }
  onEnterGame(player: Player) {
    player.drawCards(this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card321 extends EconomyTacticCard {
  private readonly cardsToRestore = 6;
  constructor() {
    super(321, 'Recycling', 2);
  }
  onEnterGame(player: Player) {
    player.deck.push(...player.pickCardsFromTopOfDiscardPile(this.cardsToRestore));
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card427 extends EconomyTacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(427, 'Immigranten von der Erde', 2);
  }
  onEnterGame(player: Player) {
    let foundCards = 0;
    for (let i = 0; i < player.deck.length; i++) {
      if (player.deck[i].type == CardType.Infrastructure) {
        player.takeCards(player.deck.splice(i, 1));
        if (++foundCards == this.cardsToDraw) break;
      }
    }
    player.shuffleDeck();
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}
