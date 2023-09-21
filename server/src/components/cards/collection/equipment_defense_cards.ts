import Player from '../../game_state/player';
import CardStack from '../card_stack';
import EquipmentCard, { EquipmentCardRechargeable } from '../types/equipment_card';

export class Card103 extends EquipmentCard {
  constructor() {
    super(103, 'Adamantiumpanzer', 5, {
      armour: 3,
      omega: -2
    });
  }
}

export class Card115 extends EquipmentCard {
  constructor() {
    super(115, 'Ablative Magnetpanzerung', 4, {
      armour: 1,
      omega: -1
    });
  }
  override get instantRecharge(): boolean {
    return true;
  }
}

export class Card140 extends EquipmentCardRechargeable {
  constructor() {
    super(140, 'Deflektorschilde', 2, {
      energy: -2,
      shield: -2,
      omega: -1
    });
  }
}

export class Card163 extends EquipmentCard {
  constructor() {
    super(163, 'Verbundpanzerung', 1, {
      hp: 2,
      armour: 1,
      omega: -1
    });
  }
}

export class Card170 extends EquipmentCardRechargeable {
  constructor() {
    super(170, 'Strahlenschilde', 1, {
      shield: 1,
      omega: -1
    });
  }
}

export class Card171 extends EquipmentCard {
  constructor() {
    super(171, 'Titanplattenplanzer', 1, {
      armour: 2,
      omega: -1
    });
  }
}

export class Card184 extends EquipmentCard {
  constructor() {
    super(184, 'Rumpferweiterung', 1, {
      hp: 4,
      omega: -1
    });
  }
}

export class Card240 extends EquipmentCard {
  constructor() {
    super(240, 'Ceramo-Stahl', 1, {
      hp: 3,
      speed: -1,
      armour: 1,
      omega: -1
    });
  }
}

export class Card312 extends EquipmentCard {
  constructor() {
    super(312, 'Refraktorfeld', 3, {
      energy: -2,
      shield: 1,
      omega: -1
    });
  }
  override getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.profile.shield == 0);
  }
  override get instantRecharge(): boolean {
    return true;
  }
}

export class Card341 extends EquipmentCard {
  constructor() {
    super(341, 'Ködersystem', 1, {
      pointDefense: 2,
      omega: -1
    });
  }
}

export class Card349 extends EquipmentCard {
  constructor() {
    super(349, 'Dura-Stahl', 1, {
      hp: 1,
      armour: 2,
      omega: -2
    });
  }
}

export class Card426 extends EquipmentCard {
  constructor() {
    super(426, 'Schildbooster', 2, {
      energy: -1,
      shield: 2,
      omega: -1
    });
  }
  override getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.profile.shield > 0);
  }
}

export class Card406 extends EquipmentCard {
  constructor() {
    super(406, 'Kohlenstoffsilikatpanzer', 4, {
      hp: 3,
      armour: 2,
      omega: -2
    });
  }
}

export class Card447 extends EquipmentCardRechargeable {
  constructor() {
    super(447, 'Schildgondel', 1, {
      hp: 1,
      shield: 1,
      omega: -2
    });
  }
}
