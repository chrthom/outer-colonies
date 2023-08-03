import Player from '../../game_state/player';
import InfrastructureCard from '../types/infrastructure_card';

abstract class InfrastructureEndOfTurnCard extends InfrastructureCard {
  onUtilizaton() {}
  onRetraction() {}
  onStartTurn() {}
}

export class Card114 extends InfrastructureEndOfTurnCard {
  readonly maxCards = 7;
  constructor() {
    super(114, 'Flottenlogistikzentrum', 4, {
      energy: -4,
      hp: 0,
      speed: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 0,
      delta: 0,
      psi: -2,
      handCardLimit: 0
    });
  }
  onEndTurn(player: Player) {
    if (player.hand.length < this.maxCards) player.drawCards(1);
  }
}

export class Card155 extends InfrastructureEndOfTurnCard {
  constructor() {
    super(155, 'Müllverarbetungsanlage', 2, {
      energy: -1,
      hp: 0,
      speed: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 0,
      delta: 0,
      psi: -1,
      handCardLimit: 0
    });
  }
  onEndTurn(player: Player) {
    if (player.discardPile.length > 0) player.deck.push(...player.pickCardsFromTopOfDiscardPile(1));
  }
}
