import { Zone } from '../../config/enums';
import CardStack from '../card_stack';
import { EquipmentCardColonyKillerRechargeable, EquipmentCardRechargeable } from '../types/equipment_card';

export class Card106 extends EquipmentCardRechargeable {
  constructor() {
    super(
      106,
      'Tachyonlanze',
      5,
      {
        energy: -4,
        xi: -2
      },
      {
        range: 4,
        damage: 8,
        pointDefense: 0,
        shield: -5,
        armour: -1
      }
    );
  }
}

export class Card107 extends EquipmentCardRechargeable {
  constructor() {
    super(
      107,
      'Partikellanze',
      4,
      {
        energy: -2,
        xi: -2
      },
      {
        range: 3,
        damage: 7,
        pointDefense: 0,
        shield: -5,
        armour: -1
      }
    );
  }
}

export class Card207 extends EquipmentCardRechargeable {
  constructor() {
    super(
      207,
      'Materiedesintegrator',
      4,
      {
        theta: -1
      },
      {
        range: 3,
        damage: 4,
        pointDefense: 0,
        shield: -99,
        armour: -2
      }
    );
  }
}

export class Card405 extends EquipmentCardColonyKillerRechargeable {
  constructor() {
    super(
      405,
      'Thermallanze',
      4,
      {
        energy: -2,
        xi: -2
      },
      {
        range: 3,
        damage: 6,
        pointDefense: 0,
        shield: -5,
        armour: -1
      }
    );
  }
}

export class Card438 extends EquipmentCardColonyKillerRechargeable {
  constructor() {
    super(
      438,
      'Feldannihilator',
      1,
      {
        theta: -1
      },
      {
        range: 2,
        damage: 2,
        pointDefense: 0,
        shield: -1,
        armour: -99
      }
    );
  }
  protected override attackDamageBeforeReductions(target: CardStack) {
    return target.zone == Zone.Colony ? 0 : this.attackProfile.damage;
  }
}
