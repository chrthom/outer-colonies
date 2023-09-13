import { CardSubtype, CardType, TacticDiscipline } from '../../config/enums';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import { InfrastructureProfile } from '../card_profile';
import InfrastructureCard from '../types/infrastructure_card';

function addToActionPool(player: Player, card: InfrastructureCard) {
  player.actionPool.push(...card.actionPool.pool);
}

function removeFromActionPool(player: Player, card: InfrastructureCard) {
  player.actionPool.remove(...card.actionPool.pool);
}

abstract class ActionInfrastructureCard extends InfrastructureCard {
  private actionPoolCardTypes!: CardSubtype[][];
  constructor(
    id: number,
    name: string,
    rarity: number,
    profile: InfrastructureProfile,
    ...actionPool: CardSubtype[][]
  ) {
    super(id, name, rarity, profile);
    this.actionPoolCardTypes = actionPool;
  }
  onUtilizaton(player: Player) {
    addToActionPool(player, this);
  }
  onRetraction(player: Player) {
    removeFromActionPool(player, this);
  }
  onStartTurn() {}
  onEndTurn() {}
  override get actionPool(): ActionPool {
    return new ActionPool(...this.actionPoolCardTypes.map(ct => new CardAction(...ct)));
  }
}

export class Card135 extends ActionInfrastructureCard {
  constructor() {
    super(
      135,
      'Schiffswerft',
      2,
      {
        energy: -2,
        hp: 0,
        speed: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: -1,
        handCardLimit: 0
      },
      [CardType.Hull]
    );
  }
}

export class Card137 extends ActionInfrastructureCard {
  constructor() {
    super(
      137,
      'Rechenzentrum',
      2,
      {
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
      },
      [TacticDiscipline.Intelligence]
    );
  }
}

export class Card138 extends ActionInfrastructureCard {
  constructor() {
    super(
      138,
      'Handelsunternehmen',
      2,
      {
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
      },
      [TacticDiscipline.Economy]
    );
  }
}

export class Card147 extends ActionInfrastructureCard {
  constructor() {
    super(
      147,
      'Kommandozentrale',
      2,
      {
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
      },
      [TacticDiscipline.Military]
    );
  }
}

export class Card148 extends ActionInfrastructureCard {
  constructor() {
    super(
      148,
      'Forschungslabor',
      2,
      {
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
      },
      [TacticDiscipline.Science]
    );
  }
}

export class Card154 extends ActionInfrastructureCard {
  constructor() {
    super(
      154,
      'Bergbauaußenposten',
      2,
      {
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
      },
      [CardType.Infrastructure]
    );
  }
}

export class Card164 extends ActionInfrastructureCard {
  constructor() {
    super(
      164,
      'Rüstungsschmiede',
      2,
      {
        energy: -2,
        hp: 0,
        speed: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: -1,
        handCardLimit: 0
      },
      [CardType.Equipment]
    );
  }
}

export class Card183 extends ActionInfrastructureCard {
  constructor() {
    super(
      183,
      'Industriekomplex',
      1,
      {
        energy: -5,
        hp: 0,
        speed: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: 0,
        handCardLimit: 0
      },
      [CardType.Equipment, CardType.Infrastructure, CardType.Hull]
    );
    this.onlyAttachableToColony = true;
  }
}

export class Card219 extends ActionInfrastructureCard {
  constructor() {
    super(
      219,
      'Freihändlerkontor',
      2,
      {
        energy: -3,
        hp: 0,
        speed: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: -2,
        handCardLimit: 0
      },
      [TacticDiscipline.Economy],
      [TacticDiscipline.Intelligence]
    );
  }
}

export class Card336 extends ActionInfrastructureCard {
  constructor() {
    super(
      336,
      'Militärakademie',
      2,
      {
        energy: -3,
        hp: 0,
        speed: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: -2,
        handCardLimit: 0
      },
      [TacticDiscipline.Military],
      [TacticDiscipline.Science]
    );
  }
}
