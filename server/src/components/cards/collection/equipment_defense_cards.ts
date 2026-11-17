import { RechargeRate } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import CardStack from '../card_stack';
import EquipmentCard, { EquipmentCardRechargeable } from '../types/equipment_card';

abstract class ShieldDefenseCard extends EquipmentCardRechargeable {
  override getValidTargets(player: Player): CardStack[] {
    return super.getValidTargets(player).filter(cs => !cs.cards.find(c => c.id == 320)); // Cannot be attached if "Refraktorfeld" is already attached
  }
}

export class Card310 extends EquipmentCard {
  constructor() {
    super(310, 'Adamantiumpanzer', 4, {
      armour: 3,
      omega: -2
    });
  }
}

export class Card104 extends EquipmentCard {
  constructor() {
    super(104, 'Ablative Magnetpanzerung', 5, {
      armour: 1,
      omega: -1
    });
  }
  override get rechargeRate(): RechargeRate {
    return RechargeRate.PerAttack;
  }
}

export class Card164 extends ShieldDefenseCard {
  constructor() {
    super(164, 'Deflektorschild', 1, {
      energy: -1,
      shield: 2,
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

export class Card170 extends ShieldDefenseCard {
  constructor() {
    super(170, 'Strahlenschilde', 1, {
      shield: 1,
      omega: -1
    });
  }
}

export class Card412 extends EquipmentCard {
  constructor() {
    super(412, 'Titanplattenpanzer', 3, {
      armour: 2,
      hp: -1,
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
      hp: 10,
      speed: -1,
      armour: 1,
      omega: -1
    });
  }
}

export class Card320 extends EquipmentCardRechargeable {
  constructor() {
    super(320, 'Refraktorfeld', 2, {
      energy: -2,
      shield: 1,
      omega: -1
    });
  }
  override getValidTargets(player: Player): CardStack[] {
    return super.getValidTargets(player).filter(cs => cs.profile.shield == 0);
  }
  override get rechargeRate(): RechargeRate {
    return RechargeRate.PerAttack;
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
    super(349, 'Dura-Stahl Platten', 1, {
      hp: 0,
      armour: 2,
      omega: -2
    });
  }
}

export class Card426 extends ShieldDefenseCard {
  constructor() {
    super(426, 'Schildbooster', 2, {
      energy: -1,
      shield: 2,
      omega: -1
    });
  }
  override getValidTargets(player: Player): CardStack[] {
    return super.getValidTargets(player).filter(cs => cs.profile.shield > 0);
  }
  override get isAttachSelfManaging(): boolean {
    return true;
  }
  override onEnterGame(player: Player, target: CardStack, cardStack: CardStack) {
    target.cardStacks.find(cs => cs.card.profile.shield > 0)?.attach(cardStack);
  }
}

export class Card406 extends EquipmentCard {
  constructor() {
    super(406, 'Kohlenstoffsilikatpanzer', 4, {
      hp: 7,
      armour: 2,
      omega: -2
    });
  }
}

export class Card447 extends ShieldDefenseCard {
  constructor() {
    super(447, 'Schildgondel', 1, {
      hp: 2,
      shield: 1,
      omega: -2
    });
  }
}

export class Card180 extends ShieldDefenseCard {
  constructor() {
    super(180, 'Heckdeflektor', 1, {
      energy: -1,
      shield: 2,
      delta: -1,
      omega: -1
    });
  }
}

export const allCards = [
  new Card310(),
  new Card104(),
  new Card164(),
  new Card163(),
  new Card170(),
  new Card412(),
  new Card184(),
  new Card240(),
  new Card320(),
  new Card341(),
  new Card349(),
  new Card406(),
  new Card426(),
  new Card447(),
  new Card180()
];
