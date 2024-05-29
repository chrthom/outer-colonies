import { EquipmentCardRechargeable } from '../types/equipment_card';

export class Card126 extends EquipmentCardRechargeable {
  constructor() {
    super(
      126,
      'Kinetische Artillerie',
      3,
      {
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

export class Card151 extends EquipmentCardRechargeable {
  constructor() {
    super(
      151,
      'Kinetikwaffenbatterie',
      2,
      {
        xi: -1
      },
      {
        range: 2,
        damage: 5,
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
        shield: 0,
        armour: -2
      }
    );
  }
}

export class Card180 extends EquipmentCardRechargeable {
  constructor() {
    super(
      180,
      'Railgun',
      1,
      {
        xi: -1
      },
      {
        range: 3,
        damage: 3,
        pointDefense: 0,
        shield: 0,
        armour: -2
      }
    );
  }
}

export class Card223 extends EquipmentCardRechargeable {
  constructor() {
    super(
      223,
      'Massebeschleuniger',
      2,
      {
        energy: -1,
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

export class Card310 extends EquipmentCardRechargeable {
  constructor() {
    super(
      310,
      'Gauss Kanone',
      4,
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
