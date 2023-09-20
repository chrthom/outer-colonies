import Player from '../../game_state/player';
import CardStack from '../card_stack';
import EquipmentCard from '../types/equipment_card';

export class Card104 extends EquipmentCard {
  readonly repairDamage = 10;
  constructor() {
    super(104, 'Reperaturnaniten', 5, {
      energy: -1,
      omega: -1
    });
  }
  override onEndTurn(player: Player, source: CardStack) {
    source.rootCardStack.damage -= Math.min(source.rootCardStack.damage, this.repairDamage);
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

export class Card161 extends EquipmentCard {
  constructor() {
    super(161, 'Ionenschubdüsen', 1, {
      energy: -1,
      speed: 1,
      delta: -1
    });
  }
}

export class Card325 extends EquipmentCard {
  readonly repairDamage = 2;
  constructor() {
    super(325, 'Selbstreparierender Torso', 2, {
      omega: -1
    });
  }
  override onEndTurn(player: Player, source: CardStack) {
    source.rootCardStack.damage -= Math.min(source.rootCardStack.damage, this.repairDamage);
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
