import { EquipmentCardRechargeable } from '../types/equipment_card';

export class Card130 extends EquipmentCardRechargeable {
  constructor() {
    super(
      130,
      'Flakartillerie',
      2,
      {
        pointDefense: 1,
        xi: -1
      },
      {
        range: 2,
        damage: 3,
        pointDefense: 0,
        shield: 0,
        armour: -3
      }
    );
  }
}

export class Card168 extends EquipmentCardRechargeable {
  constructor() {
    super(
      168,
      'Automatikkanone',
      1,
      {
        pointDefense: 2,
        theta: -1
      },
      {
        range: 1,
        damage: 2,
        pointDefense: 0,
        shield: 0,
        armour: -99
      }
    );
  }
}

export class Card181 extends EquipmentCardRechargeable {
  constructor() {
    super(
      181,
      'Flugabwehrkanone',
      1,
      {
        pointDefense: 1,
        theta: -1
      },
      {
        range: 1,
        damage: 4,
        pointDefense: 0,
        shield: 0,
        armour: -4
      }
    );
  }
}

export class Card234 extends EquipmentCardRechargeable {
  constructor() {
    super(
      234,
      'Punktabwehrlaser',
      1,
      {
        pointDefense: 2,
        theta: -1
      },
      {
        range: 1,
        damage: 2,
        pointDefense: 0,
        shield: -99,
        armour: -1
      }
    );
  }
}

export class Card237 extends EquipmentCardRechargeable {
  constructor() {
    super(
      237,
      'Mini-Railgun',
      1,
      {
        pointDefense: 1,
        theta: -1
      },
      {
        range: 3,
        damage: 1,
        pointDefense: 0,
        shield: 0,
        armour: -99
      }
    );
  }
}

export class Card339 extends EquipmentCardRechargeable {
  constructor() {
    super(
      339,
      'Gatling',
      1,
      {
        pointDefense: 2,
        theta: -1
      },
      {
        range: 1,
        damage: 2,
        pointDefense: 0,
        shield: 0,
        armour: -99
      }
    );
  }
}

export class Card340 extends EquipmentCardRechargeable {
  constructor() {
    super(
      340,
      'Abfangraketenwerfer',
      1,
      {
        pointDefense: 1,
        phi: -1
      },
      {
        range: 1,
        damage: 6,
        pointDefense: -3,
        shield: 0,
        armour: -3
      }
    );
  }
}

export class Card424 extends EquipmentCardRechargeable {
  constructor() {
    super(
      424,
      'Sturmgeschütz',
      2,
      {
        energy: -1,
        pointDefense: 1,
        xi: -1
      },
      {
        range: 1,
        damage: 8,
        pointDefense: 0,
        shield: 0,
        armour: -4
      }
    );
  }
}

export class Card440 extends EquipmentCardRechargeable {
  constructor() {
    super(
      440,
      'Impulskanone',
      1,
      {
        pointDefense: 1,
        theta: -1
      },
      {
        range: 2,
        damage: 2,
        pointDefense: 0,
        shield: -99,
        armour: -2
      }
    );
  }
}

export class Card441 extends EquipmentCardRechargeable {
  constructor() {
    super(
      441,
      'Flechettewerfer',
      1,
      {
        pointDefense: 1,
        theta: -1
      },
      {
        range: 1,
        damage: 5,
        pointDefense: 0,
        shield: 0,
        armour: -99
      }
    );
  }
}
