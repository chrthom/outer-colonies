import CardStack from '../card_stack';
import { EquipmentCardColonyKillerRechargeable, EquipmentCardRechargeable } from '../types/equipment_card';

export class Card166 extends EquipmentCardRechargeable {
  constructor() {
    super(
      166,
      'Laserkanone',
      1,
      {
        theta: -1
      },
      {
        range: 2,
        damage: 3,
        pointDefense: 0,
        shield: -3,
        armour: -1
      }
    );
  }
}

export class Card182 extends EquipmentCardRechargeable {
  constructor() {
    super(
      182,
      'Dual-Lasergeschütz',
      1,
      {
        energy: -1,
        xi: -1
      },
      {
        range: 2,
        damage: 5,
        pointDefense: 0,
        shield: -3,
        armour: -1
      }
    );
  }
}

export class Card224 extends EquipmentCardColonyKillerRechargeable {
  constructor() {
    super(
      224,
      'Bergbaulaser',
      2,
      {
        theta: -1,
        omega: -1
      },
      {
        range: 1,
        damage: 7,
        pointDefense: 0,
        shield: -6,
        armour: -1
      }
    );
  }
  protected override attackDamageBeforeReductions(target: CardStack) {
    return target.profile.speed < 3 ? this.attackProfile.damage : 0;
  }
}

export class Card343 extends EquipmentCardRechargeable {
  constructor() {
    super(
      343,
      'Laserphalanx',
      1,
      {
        energy: -1,
        theta: -1
      },
      {
        range: 2,
        damage: 4,
        pointDefense: 0,
        shield: -2,
        armour: -2
      }
    );
  }
}

export class Card344 extends EquipmentCardRechargeable {
  constructor() {
    super(
      344,
      'Fokuslaser',
      1,
      {
        theta: -1
      },
      {
        range: 3,
        damage: 2,
        pointDefense: 0,
        shield: -2,
        armour: -1
      }
    );
  }
}

export class Card347 extends EquipmentCardRechargeable {
  constructor() {
    super(
      347,
      'Impulslaser',
      1,
      {
        xi: -1
      },
      {
        range: 2,
        damage: 5,
        pointDefense: 0,
        shield: -4,
        armour: -2
      }
    );
  }
}

export class Card421 extends EquipmentCardRechargeable {
  constructor() {
    super(
      421,
      'Salvenlaser',
      2,
      {
        energy: -1,
        theta: -2
      },
      {
        range: 2,
        damage: 6,
        pointDefense: 0,
        shield: -3,
        armour: -2
      }
    );
  }
}
