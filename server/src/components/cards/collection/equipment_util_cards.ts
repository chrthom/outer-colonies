import Player from '../../game_state/player';
import { pickRandom } from '../../utils/helpers';
import CardStack from '../card_stack';
import EquipmentCard from '../types/equipment_card';

export class Card115 extends EquipmentCard {
  constructor() {
    super(115, 'Reparaturnaniten', 4, {
      hp: 10,
      energy: -1,
      omega: -1
    });
  }
  override onEndTurn(player: Player, source: CardStack) {
    this.repairAllDamage(source.rootCardStack);
  }
}

export class Card413 extends EquipmentCard {
  constructor() {
    super(413, 'Plasmanachbrenner', 3, {
      energy: -1,
      speed: 2,
      delta: -1
    });
  }
}

export class Card124 extends EquipmentCard {
  constructor() {
    super(124, 'Universaladapter', 3, {
      omega: 1,
      phi: 1,
      theta: 1,
      xi: -1
    });
  }
}

export class Card161 extends EquipmentCard {
  constructor() {
    super(161, 'Ionenschubdüsen', 1, {
      energy: 0,
      speed: 1,
      delta: -1
    });
  }
}

export class Card211 extends EquipmentCard {
  constructor() {
    super(211, 'Tarnkappe', 3, {
      control: 3,
      speed: -1,
      delta: -1,
      omega: -1
    });
  }
}

export class Card212 extends EquipmentCard {
  constructor() {
    super(212, 'Black Ops Team', 3, {
      omega: -1,
      psi: -1,
      control: 3
    });
  }
}

export class Card241 extends EquipmentCard {
  constructor() {
    super(241, 'Freibeuterbesatzung', 1, {
      omega: -1
    });
  }
  override onMissionCompletion(player: Player): void {
    const opponent = player.match.inactivePlayer;
    opponent.discardHandCards(pickRandom(opponent.hand).uuid);
  }
}

export class Card343 extends EquipmentCard {
  private readonly damageToRepair = 4;
  constructor() {
    super(343, 'Selbstreparierender Torso', 1, {
      hp: 2,
      omega: -1
    });
  }
  override onEndTurn(player: Player, source: CardStack) {
    this.repairDamage(source.rootCardStack, this.damageToRepair);
  }
}

export class Card441 extends EquipmentCard {
  constructor() {
    super(441, 'Leichtbauweise', 1, {
      hp: 0,
      speed: 1,
      delta: -1
    });
  }
}

export class Card449 extends EquipmentCard {
  constructor() {
    super(449, 'Schwerer Rumpf', 1, {
      hp: 15,
      speed: -1,
      delta: -1
    });
  }
}

export class Card171 extends EquipmentCard {
  constructor() {
    super(171, 'Quantenmechanischer Antrieb', 1, {
      energy: 0,
      speed: 1,
      delta: -1
    });
  }
}

export class Card545 extends EquipmentCard {
  constructor() {
    super(545, 'Schwere Bewaffnung', 1, {
      theta: -1,
      xi: 1
    });
  }
}

export const allCards = [
  new Card115(),
  new Card413(),
  new Card124(),
  new Card161(),
  new Card211(),
  new Card212(),
  new Card241(),
  new Card343(),
  new Card441(),
  new Card449(),
  new Card171(),
  new Card545()
];
