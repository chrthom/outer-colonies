import { Zone } from '../../../shared/config/enums';
import CardStack from '../card_stack';
import { EquipmentCardRechargeable } from '../types/equipment_card';

export class Card302 extends EquipmentCardRechargeable {
  constructor() {
    super(
      302,
      'Götterdämmerung',
      5,
      {
        energy: -6,
        xi: -3
      },
      {
        range: 1,
        damage: 50,
        pointDefense: 0,
        shield: -6,
        armour: -3
      }
    );
  }
}

export class Card401 extends EquipmentCardRechargeable {
  private readonly damageReductionPerSpeedPoint = 6;
  constructor() {
    super(
      401,
      'Guillotine',
      5,
      {
        energy: -3,
        xi: -2
      },
      {
        range: 2,
        damage: 30,
        pointDefense: 0,
        shield: -8,
        armour: -3
      }
    );
  }
  protected override attackDamageBeforeReductions(target: CardStack) {
    const damage = Math.max(
      0,
      this.attackProfile.damage - target.profile.speed * this.damageReductionPerSpeedPoint
    );
    return target.zone == Zone.Colony ? 0 : damage;
  }
}
