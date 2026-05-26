import Player from '../../game_state/player';
import InfrastructureCard from '../types/infrastructure_card';

export class Card114 extends InfrastructureCard {
  readonly maxCards = 7;
  constructor() {
    super(114, 'Flottenlogistikzentrum', 4, {
      energy: -4,
      psi: -2
    });
  }
  override onEndTurn(player: Player) {
    if (player.hand.length < this.maxCards) player.drawCards(1);
  }
}

export class Card155 extends InfrastructureCard {
  constructor() {
    super(155, 'Müllverarbeitungsanlage', 2, {
      energy: -1,
      psi: -1
    });
  }
  override onEndTurn(player: Player) {
    if (player.discardPile.length > 0) player.deck.push(...player.pickCardsFromTopOfDiscardPile(1));
  }
}
