import { BattleType, CardType, TurnPhase } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import CardStack from '../card_stack';
import InfrastructureCard from '../types/infrastructure_card';

abstract class CardPowerPlant extends InfrastructureCard {
  constructor(id: number) {
    super(id, 'Kraftwerk', 0, {
      energy: 5
    });
  }
  protected override get onlyAttachableToColony(): boolean {
    return true;
  }
}

abstract class CardNuclearReactor extends InfrastructureCard {
  constructor(id: number) {
    super(id, 'Atomreaktor', 0, {
      energy: 2,
      omega: -1
    });
  }
}

abstract class CardSolarPanel extends InfrastructureCard {
  constructor(id: number) {
    super(id, 'Solarpanele', 0, {
      energy: 1
    });
  }
  override getValidTargets(player: Player): CardStack[] {
    const colonyCards = player.colonyCardStack.cards;
    if (colonyCards.some(c => c.name == 'Pluto')) return [];
    const validTargets = super.getValidTargets(player);
    if (colonyCards.some(c => c.name == 'Triton')) {
      return validTargets.filter(cs => cs.card.type != CardType.Colony);
    }
    return validTargets;
  }
}

export class Card105 extends InfrastructureCard {
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

export class Card145 extends InfrastructureCard {
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

export class Card187 extends CardNuclearReactor {
  constructor() {
    super(187);
  }
}

export class Card188 extends CardSolarPanel {
  constructor() {
    super(188);
  }
}

export class Card242 extends CardPowerPlant {
  constructor() {
    super(242);
  }
}

export class Card244 extends CardNuclearReactor {
  constructor() {
    super(244);
  }
}

export class Card245 extends CardSolarPanel {
  constructor() {
    super(245);
  }
}

export class Card350 extends CardPowerPlant {
  constructor() {
    super(350);
  }
}

export class Card352 extends CardNuclearReactor {
  constructor() {
    super(352);
  }
}

export class Card353 extends CardSolarPanel {
  constructor() {
    super(353);
  }
}

export class Card451 extends CardNuclearReactor {
  constructor() {
    super(451);
  }
}

export class Card452 extends CardSolarPanel {
  constructor() {
    super(452);
  }
}

export class Card453 extends CardPowerPlant {
  constructor() {
    super(453);
  }
}

export class Card558 extends CardSolarPanel {
  constructor() {
    super(558);
  }
}

export class Card560 extends CardPowerPlant {
  constructor() {
    super(560);
  }
}

export class Card561 extends CardNuclearReactor {
  constructor() {
    super(561);
  }
}

export const allCards = [
  new Card105(),
  new Card145(),
  new Card185(),
  new Card187(),
  new Card188(),
  new Card242(),
  new Card244(),
  new Card245(),
  new Card350(),
  new Card352(),
  new Card353(),
  new Card451(),
  new Card452(),
  new Card453(),
  new Card558(),
  new Card560(),
  new Card561()
];
