import InfrastructureCard from '../types/infrastructure_card';

abstract class InfrastructureDefenseCard extends InfrastructureCard {
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
  override get isColonyDefense(): boolean {
    return true;
  }
  protected override get onlyAttachableToColony(): boolean {
    return true;
  }
}

export class Card156 extends InfrastructureDefenseCard {
  constructor() {
    super(156, 'Planetarer Schild', 2, {
      hp: 5,
      shield: 1,
      energy: -2
    });
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

export class Card238 extends InfrastructureDefenseCard {
  constructor() {
    super(238, 'Schmugglernest', 1, {
      hp: 4,
      pointDefense: 1,
      handCardLimit: 1
    });
  }
}

export class Card345 extends InfrastructureDefenseCard {
  constructor() {
    super(345, 'Autonomer Stützpunkt', 1, {
      hp: 4,
      pointDefense: 1,
      energy: 1
    });
  }
}

export class Card448 extends InfrastructureDefenseCard {
  constructor() {
    super(448, 'Schildkuppel', 1, {
      hp: 5,
      shield: 1,
      energy: -1
    });
  }
}
