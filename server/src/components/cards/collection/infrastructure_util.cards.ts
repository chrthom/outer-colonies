import Player from '../../game_state/player';
import InfrastructureCard from '../types/infrastructure_card';

abstract class InfrastructureUtilCard extends InfrastructureCard {
  onUtilizaton() {}
  onRetraction() {}
  onStartTurn() {}
  onEndTurn() {}
}

export class Card172 extends InfrastructureUtilCard {
  constructor() {
    super(172, 'Ressourcensilo', 1, {
      energy: 0,
      hp: 0,
      speed: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 0,
      delta: 0,
      psi: -1,
      handCardLimit: 2,
    });
  }
}
