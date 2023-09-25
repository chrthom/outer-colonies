import { BattleType, CardType, TurnPhase } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import CardStack from '../card_stack';
import InfrastructureCard from '../types/infrastructure_card';

abstract class InfrastructureEnergyCard extends InfrastructureCard {
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
}

abstract class CardPowerPlant extends InfrastructureEnergyCard {
  constructor(id: number) {
    super(id, 'Kraftwerk', 0, {
      energy: 5
    });
  }
  protected override get onlyAttachableToColony(): boolean {
    return true;
  }
}

abstract class NuclearReactorCard extends InfrastructureEnergyCard {
  constructor(id: number) {
    super(id, 'Atomreaktor', 0, {
      energy: 2,
      omega: -1
    });
  }
}

abstract class SolarPanelCard extends InfrastructureEnergyCard {
  constructor(id: number) {
    super(id, 'Solarpanele', 0, {
      energy: 1
    });
  }
  override getValidTargets(player: Player): CardStack[] {
    let validTargets = super.getValidTargets(player);
    if (player.colonyCardStack.cards.some(c => c.id == 433)) {
      validTargets = validTargets.filter(cs => cs.card.type != CardType.Colony);
    } else if (player.colonyCardStack.cards.some(c => c.id == 403)) {
      validTargets = [];
    }
    return validTargets;
  }
}

export class Card105 extends InfrastructureEnergyCard {
  constructor() {
    super(105, 'Antimateriereaktor', 5, {
      energy: 10,
      omega: -3
    });
  }
  override onDestruction(player: Player) {
    const battle = player.match.battle;
    if (player.match.turnPhase == TurnPhase.Combat && battle.type != BattleType.None) {
      battle.ships.flat().forEach(cs => cs.damage++);
    }
  }
}

export class Card145 extends InfrastructureEnergyCard {
  constructor() {
    super(145, 'Fusionsreaktor', 2, {
      energy: 4,
      omega: -2
    });
  }
}

export class Card185 extends CardPowerPlant {
  constructor() {
    super(185);
  }
}

export class Card187 extends NuclearReactorCard {
  constructor() {
    super(187);
  }
}

export class Card188 extends SolarPanelCard {
  constructor() {
    super(188);
  }
}

export class Card242 extends CardPowerPlant {
  constructor() {
    super(242);
  }
}

export class Card244 extends NuclearReactorCard {
  constructor() {
    super(244);
  }
}

export class Card245 extends SolarPanelCard {
  constructor() {
    super(245);
  }
}

export class Card350 extends CardPowerPlant {
  constructor() {
    super(350);
  }
}

export class Card352 extends NuclearReactorCard {
  constructor() {
    super(352);
  }
}

export class Card353 extends SolarPanelCard {
  constructor() {
    super(353);
  }
}

export class Card451 extends NuclearReactorCard {
  constructor() {
    super(451);
  }
}

export class Card452 extends SolarPanelCard {
  constructor() {
    super(452);
  }
}

export class Card453 extends CardPowerPlant {
  constructor() {
    super(453);
  }
}
