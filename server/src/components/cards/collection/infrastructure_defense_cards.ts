import InfrastructureCard from '../types/infrastructure_card';

abstract class InfrastructureDefenseCard extends InfrastructureCard {
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
}

export class Card169 extends InfrastructureDefenseCard {
  constructor() {
    super(169, 'Verteidigungsnetz', 1, {
      hp: 5
    });
  }
}
