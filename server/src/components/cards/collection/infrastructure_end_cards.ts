import Player from '../../game_state/player';
import InfrastructureCard from '../types/infrastructure_card';

abstract class InfrastructureEndOfTurnCard extends InfrastructureCard {
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
}

export class Card114 extends InfrastructureEndOfTurnCard {
  readonly maxCards = 7;
  constructor() {
    super(114, 'Flottenlogistikzentrum', 4, {
      energy: -4,
      psi: -2
    });
  }
  onEndTurn(player: Player) {
    if (player.hand.length < this.maxCards) player.drawCards(1);
  }
}

export class Card155 extends InfrastructureEndOfTurnCard {
  constructor() {
    super(155, 'Müllverarbeitungsanlage', 2, {
      energy: -1,
      psi: -1
    });
  }
  onEndTurn(player: Player) {
    if (player.discardPile.length > 0) player.deck.push(...player.pickCardsFromTopOfDiscardPile(1));
  }
}
