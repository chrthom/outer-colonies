import InfrastructureCard from '../types/infrastructure_card';

abstract class InfrastructureUtilCard extends InfrastructureCard {
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
}

export class Card172 extends InfrastructureUtilCard {
  constructor() {
    super(172, 'Ressourcensilo', 1, {
      psi: -1,
      handCardLimit: 2
    });
  }
}
