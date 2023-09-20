import EquipmentCard, { EquipmentCardColonyKiller } from '../types/equipment_card';

export class Card101 extends EquipmentCard {
  constructor() {
    super(
      101,
      'Quantentorpedos',
      5,
      {
        energy: -1,
        phi: -1
      },
      {
        range: 2,
        damage: 24,
        pointDefense: -9,
        shield: -7,
        armour: -4
      }
    );
  }
}

export class Card127 extends EquipmentCard {
  constructor() {
    super(
      127,
      'Protontorpedos',
      3,
      {
        phi: -1
      },
      {
        range: 2,
        damage: 15,
        pointDefense: -6,
        shield: -7,
        armour: -4
      }
    );
  }
}

export class Card136 extends EquipmentCard {
  constructor() {
    super(
      136,
      'Plasmatorpedos',
      2,
      {
        phi: -1
      },
      {
        range: 2,
        damage: 10,
        pointDefense: -5,
        shield: 0,
        armour: -1
      }
    );
  }
}

export class Card150 extends EquipmentCardColonyKiller {
  constructor() {
    super(
      150,
      'Fusionsbombentorpedos',
      2,
      {
        phi: -1,
        omega: -1
      },
      {
        range: 2,
        damage: 12,
        pointDefense: -6,
        shield: -3,
        armour: -4
      }
    );
  }
}

export class Card167 extends EquipmentCardColonyKiller {
  constructor() {
    super(
      167,
      'Atombombentorpedos',
      1,
      {
        phi: -1
      },
      {
        range: 2,
        damage: 10,
        pointDefense: -5,
        shield: -3,
        armour: -4
      }
    );
  }
}

export class Card216 extends EquipmentCard {
  constructor() {
    super(
      216,
      'Schwarmraketensystem',
      3,
      {
        phi: -1
      },
      {
        range: 2,
        damage: 8,
        pointDefense: -2,
        shield: 0,
        armour: -4
      }
    );
  }
}

export class Card304 extends EquipmentCard {
  constructor() {
    super(
      304,
      'Antimaterietorpedos',
      5,
      {
        energy: -2,
        phi: -1
      },
      {
        range: 2,
        damage: 22,
        pointDefense: -11,
        shield: 0,
        armour: -1
      }
    );
  }
}

export class Card318 extends EquipmentCardColonyKiller {
  constructor() {
    super(
      318,
      'Nova-Torpedos',
      3,
      {
        energy: -1,
        phi: -1
      },
      {
        range: 2,
        damage: 14,
        pointDefense: -7,
        shield: -4,
        armour: -3
      }
    );
  }
}

export class Card412 extends EquipmentCard {
  constructor() {
    super(
      412,
      'Langstreckentorpedos',
      3,
      {
        phi: -1
      },
      {
        range: 3,
        damage: 8,
        pointDefense: -4,
        shield: 0,
        armour: -1
      }
    );
  }
}

export class Card422 extends EquipmentCardColonyKiller {
  constructor() {
    super(
      422,
      'Feuersturmtorpedos',
      3,
      {
        phi: -1
      },
      {
        range: 2,
        damage: 8,
        pointDefense: -4,
        shield: 0,
        armour: -4
      }
    );
  }
}
