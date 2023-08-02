import { CardType } from '../../config/enums';
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
  private actionPoolCardTypes!: CardType[];
  constructor(
    id: number,
    name: string,
    rarity: number,
    profile: InfrastructureProfile,
    actionPool: CardType[],
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
  get actionPool(): ActionPool {
    return new ActionPool(new CardAction(...this.actionPoolCardTypes));
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
        handCardLimit: 0,
      },
      [CardType.Hull],
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
        handCardLimit: 0,
      },
      [CardType.Infrastructure],
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
        handCardLimit: 0,
      },
      [CardType.Equipment],
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
        handCardLimit: 0,
      },
      [CardType.Equipment, CardType.Infrastructure, CardType.Hull],
    );
    this.onlyAttachableToColony = true;
  }
}
