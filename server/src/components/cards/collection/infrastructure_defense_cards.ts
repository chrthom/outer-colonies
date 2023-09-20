import InfrastructureCard from '../types/infrastructure_card';

abstract class InfrastructureDefenseCard extends InfrastructureCard {
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
  override get isColonyDefense(): boolean {
    return true;
  }
}

export class Card169 extends InfrastructureDefenseCard {
  constructor() {
    super(169, 'Verteidigungsnetz', 1, {
      hp: 5,
      pointDefense: 2
    });
  }
}
