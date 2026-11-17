import { EquipmentCardRechargeable } from '../types/equipment_card';

export class Card126 extends EquipmentCardRechargeable {
  constructor() {
    super(
      126,
      'Kinetische Artillerie',
      3,
      {
        energy: -1,
        xi: -2
      },
      {
        range: 2,
        damage: 8,
        pointDefense: 0,
        shield: 0,
        armour: -4
      }
    );
  }
}

export class Card125 extends EquipmentCardRechargeable {
  constructor() {
    super(
      125,
      'Kinetikwaffenbatterie',
      3,
      {
        xi: -1
      },
      {
        range: 2,
        damage: 4,
        pointDefense: 0,
        shield: 0,
        armour: -4
      }
    );
  }
}

export class Card179 extends EquipmentCardRechargeable {
  constructor() {
    super(
      179,
      'Pulskanone',
      1,
      {
        theta: -1
      },
      {
        range: 3,
        damage: 2,
        pointDefense: 0,
        shield: -99,
        armour: -99
      }
    );
  }
}

export class Card522 extends EquipmentCardRechargeable {
  constructor() {
    super(
      522,
      'Railgun',
      2,
      {
        xi: -1
      },
      {
        range: 3,
        damage: 2,
        pointDefense: 0,
        shield: 0,
        armour: -2
      }
    );
  }
}

export class Card207 extends EquipmentCardRechargeable {
  constructor() {
    super(
      207,
      'Massebeschleuniger',
      4,
      {
        energy: -2,
        xi: -1
      },
      {
        range: 3,
        damage: 4,
        pointDefense: 0,
        shield: 0,
        armour: -2
      }
    );
  }
}

export class Card103 extends EquipmentCardRechargeable {
  constructor() {
    super(
      103,
      'Gauss Kanone',
      5,
      {
        energy: -3,
        xi: -2
      },
      {
        range: 4,
        damage: 5,
        pointDefense: 0,
        shield: 0,
        armour: -2
      }
    );
  }
}

export class Card420 extends EquipmentCardRechargeable {
  constructor() {
    super(
      420,
      'Donnerkanone',
      2,
      {
        energy: -1,
        xi: -1
      },
      {
        range: 1,
        damage: 11,
        pointDefense: 0,
        shield: 0,
        armour: -5
      }
    );
  }
}

export const allCards = [
  new Card126(),
  new Card125(),
  new Card179(),
  new Card522(),
  new Card207(),
  new Card103(),
  new Card420()
];
