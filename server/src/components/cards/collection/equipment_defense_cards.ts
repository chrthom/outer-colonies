import Player from '../../game_state/player';
import CardStack from '../card_stack';
import EquipmentCard, { EquipmentCardRechargeable } from '../types/equipment_card';

export class Card103 extends EquipmentCard {
  constructor() {
    super(103, 'Adamantiumpanzer', 5, {
      energy: 0,
      hp: 0,
      speed: 0,
      pointDefense: 0,
      shield: 0,
      armour: 3,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -2,
      delta: 0,
      psi: 0
    });
  }
}

export class Card140 extends EquipmentCardRechargeable {
  constructor() {
    super(140, 'Deflektorschilde', 2, {
      energy: -2,
      hp: 0,
      speed: 0,
      pointDefense: 0,
      shield: -2,
      armour: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -1,
      delta: 0,
      psi: 0
    });
  }
}

export class Card163 extends EquipmentCard {
  constructor() {
    super(163, 'Verbundpanzerung', 1, {
      energy: 0,
      hp: 2,
      speed: 0,
      pointDefense: 0,
      shield: 0,
      armour: 1,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -1,
      delta: 0,
      psi: 0
    });
  }
}

export class Card170 extends EquipmentCardRechargeable {
  constructor() {
    super(170, 'Strahlenschilde', 1, {
      energy: 0,
      hp: 0,
      speed: 0,
      pointDefense: 0,
      shield: 1,
      armour: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -1,
      delta: 0,
      psi: 0
    });
  }
}

export class Card171 extends EquipmentCard {
  constructor() {
    super(171, 'Titanplattenplanzer', 1, {
      energy: 0,
      hp: 0,
      speed: 0,
      pointDefense: 0,
      shield: 0,
      armour: 2,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -1,
      delta: 0,
      psi: 0
    });
  }
}

export class Card184 extends EquipmentCard {
  constructor() {
    super(184, 'Rumpferweiterung', 1, {
      energy: 0,
      hp: 4,
      speed: 0,
      pointDefense: 0,
      shield: 0,
      armour: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -1,
      delta: 0,
      psi: 0
    });
  }
}

export class Card240 extends EquipmentCard {
  constructor() {
    super(240, 'Ceramo-Stahl', 1, {
      energy: 0,
      hp: 3,
      speed: -1,
      pointDefense: 0,
      shield: 0,
      armour: 1,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -1,
      delta: 0,
      psi: 0
    });
  }
}

export class Card341 extends EquipmentCard {
  constructor() {
    super(341, 'Ködersystem', 1, {
      energy: 0,
      hp: 0,
      speed: 0,
      pointDefense: 2,
      shield: 0,
      armour: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -1,
      delta: 0,
      psi: 0
    });
  }
}

export class Card349 extends EquipmentCard {
  constructor() {
    super(349, 'Dura-Stahl', 1, {
      energy: 0,
      hp: 1,
      speed: 0,
      pointDefense: 0,
      shield: 0,
      armour: 2,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -2,
      delta: 0,
      psi: 0
    });
  }
}

export class Card426 extends EquipmentCard {
  constructor() {
    super(426, 'Schildbooster', 2, {
      energy: -1,
      hp: 0,
      speed: 0,
      pointDefense: 0,
      shield: 2,
      armour: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -1,
      delta: 0,
      psi: 0
    });
  }
  override getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.profile.shield > 0);
  }
}

export class Card406 extends EquipmentCard {
  constructor() {
    super(406, 'Kohlenstoffsilikatpanzer', 4, {
      energy: 0,
      hp: 3,
      speed: 0,
      pointDefense: 0,
      shield: 0,
      armour: 2,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -2,
      delta: 0,
      psi: 0
    });
  }
}

export class Card447 extends EquipmentCardRechargeable {
  constructor() {
    super(447, 'Schildgondel', 1, {
      energy: 0,
      hp: 1,
      speed: 0,
      pointDefense: 0,
      shield: 1,
      armour: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: -2,
      delta: 0,
      psi: 0
    });
  }
}
