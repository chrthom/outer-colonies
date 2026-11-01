import Player from '../../game_state/player';
import { pickRandom } from '../../utils/helpers';
import CardStack from '../card_stack';
import EquipmentCard from '../types/equipment_card';

export class Card104 extends EquipmentCard {
  private readonly damageToRepair = 10;
  constructor() {
    super(104, 'Reperaturnaniten', 5, {
      energy: -1,
      omega: -1
    });
  }
  override onEndTurn(player: Player, source: CardStack) {
    this.repairDamage(source.rootCardStack, this.damageToRepair);
  }
}

export class Card109 extends EquipmentCard {
  constructor() {
    super(109, 'Plasmanachbrenner', 4, {
      energy: -3,
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
      energy: -1,
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
      delta: -1,
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

export class Card325 extends EquipmentCard {
  private readonly damageToRepair = 2;
  constructor() {
    super(325, 'Selbstreparierender Torso', 2, {
      omega: -1
    });
  }
  override onEndTurn(player: Player, source: CardStack) {
    this.repairDamage(source.rootCardStack, this.damageToRepair);
  }
}

export class Card434 extends EquipmentCard {
  constructor() {
    super(434, 'Leichtbauweise', 2, {
      hp: -3,
      speed: 1,
      delta: -1
    });
  }
}

export class Card449 extends EquipmentCard {
  constructor() {
    super(449, 'Schwerer Rumpf', 1, {
      hp: 5,
      speed: -1,
      delta: -1
    });
  }
}

export class Card537 extends EquipmentCard {
  constructor() {
    super(537, 'Quantenmechanischer Antrieb', 2, {
      speed: 1,
      delta: -1,
      omega: -1
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
  new Card104(),
  new Card109(),
  new Card124(),
  new Card161(),
  new Card211(),
  new Card212(),
  new Card241(),
  new Card325(),
  new Card434(),
  new Card449(),
  new Card537(),
  new Card545()
];
