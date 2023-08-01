import { Zone } from '../../config/enums';
import CardStack from '../card_stack';
import EquipmentCard from '../types/equipment_card';

export class Card401 extends EquipmentCard {
  private readonly damageReductionPerSpeedPoint = 6;
  constructor() {
    super(
      401,
      'Guillotine',
      5,
      {
        energy: -3,
        hp: 0,
        speed: 0,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: -2,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: 0,
      },
      true,
      {
        range: 2,
        damage: 30,
        pointDefense: 0,
        shield: -8,
        armour: -3,
      },
    );
  }
  protected attackDamageBeforeReductions(target: CardStack) {
    const damage = Math.max(
      0,
      this.attackProfile.damage - target.profile().speed * this.damageReductionPerSpeedPoint,
    );
    return target.zone == Zone.Colony ? 0 : damage;
  }
}
