import { CardSubtype, CardType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import { CardRarity } from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';
import InfrastructureCard from '../types/infrastructure_card';

abstract class ActionInfrastructureCard extends InfrastructureCard {
  private actionPoolCardTypes!: CardSubtype[][];
  constructor(
    id: number,
    name: string,
    rarity: CardRarity,
    profile: CardProfileConfig,
    ...actionPool: CardSubtype[][]
  ) {
    super(id, name, rarity, profile);
    this.actionPoolCardTypes = actionPool;
  }
  onEnterGame(player: Player) {
    this.addToActionPool(player);
  }
  onLeaveGame(player: Player) {
    this.removeFromActionPool(player);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onStartTurn(player: Player, cardStack: CardStack) {}
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
        psi: -1
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
        psi: -1
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
        psi: -1
      },
      [TacticDiscipline.Trade]
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
        psi: -1
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
        psi: -1
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
        psi: -1
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
        psi: -1
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
        energy: -5
      },
      [CardType.Equipment, CardType.Infrastructure, CardType.Hull]
    );
  }
  protected override get onlyAttachableToColony(): boolean {
    return true;
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
        psi: -2
      },
      [TacticDiscipline.Trade],
      [TacticDiscipline.Intelligence]
    );
  }
}

export class Card320 extends ActionInfrastructureCard {
  constructor() {
    super(
      320,
      'Legierungsgießerei',
      2,
      {
        energy: -3,
        psi: -1
      },
      [CardType.Equipment, CardType.Hull]
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
        psi: -2
      },
      [TacticDiscipline.Military],
      [TacticDiscipline.Science]
    );
  }
}

export class Card413 extends ActionInfrastructureCard {
  constructor() {
    super(
      413,
      'Logistikknotenpunkt',
      3,
      {
        energy: -2,
        psi: -1
      },
      [TacticDiscipline.Trade]
    );
  }
  override onStartTurn(player: Player, cardStack: CardStack) {
    if (cardStack.zone != Zone.Colony && cardStack.profile.speed > 0) {
      this.additionalCardWhenDrawing(player, TacticDiscipline.Military, TacticDiscipline.Trade);
    }
  }
}
