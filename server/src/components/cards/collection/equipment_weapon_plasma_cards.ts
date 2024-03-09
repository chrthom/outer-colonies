import { EquipmentCardRechargeable } from '../types/equipment_card';

export class Card118 extends EquipmentCardRechargeable {
  constructor() {
    super(
      118,
      'Ionendisruptor',
      3,
      {
        theta: -1
      },
      {
        range: 1,
        damage: 5,
        pointDefense: 0,
        shield: 0,
        armour: 0
      }
    );
  }
}

export class Card125 extends EquipmentCardRechargeable {
  constructor() {
    super(
      125,
      'Plasmakanone',
      3,
      {
        energy: -1,
        xi: -1
      },
      {
        range: 1,
        damage: 14,
        pointDefense: 0,
        shield: -6,
        armour: -1
      }
    );
  }
}

export class Card157 extends EquipmentCardRechargeable {
  constructor() {
    super(
      157,
      'Plasmawerfer',
      2,
      {
        theta: -1
      },
      {
        range: 1,
        damage: 7,
        pointDefense: 0,
        shield: -7,
        armour: -1
      }
    );
  }
}

export class Card209 extends EquipmentCardRechargeable {
  constructor() {
    super(
      209,
      'Phasendisruptor',
      4,
      {
        xi: -1
      },
      {
        range: 1,
        damage: 7,
        pointDefense: 0,
        shield: 0,
        armour: 0
      }
    );
  }
}

export class Card303 extends EquipmentCardRechargeable {
  constructor() {
    super(
      303,
      'Archenemitter',
      5,
      {
        energy: -2,
        theta: -2
      },
      {
        range: 2,
        damage: 9,
        pointDefense: 0,
        shield: 0,
        armour: 0
      }
    );
  }
}

export class Card409 extends EquipmentCardRechargeable {
  constructor() {
    super(
      409,
      'Plasmabeschleuniger',
      4,
      {
        energy: -2,
        xi: -2
      },
      {
        range: 1,
        damage: 27,
        pointDefense: 0,
        shield: -6,
        armour: -1
      }
    );
  }
}
