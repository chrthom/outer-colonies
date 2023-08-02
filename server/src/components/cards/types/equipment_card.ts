import Card, { AttackResult } from '../card';
import CardProfile, { EquipmentProfile } from '../card_profile';
import CardStack from '../card_stack';
import Match from '../../game_state/match';
import { AttackProfile } from '../card_profile';
import { CardType } from '../../config/enums';
import Player from '../../game_state/player';

export default abstract class EquipmentCard extends Card {
  readonly equipmentProfile!: EquipmentProfile;
  readonly attackProfile?: AttackProfile;
  constructor(
    id: number,
    name: string,
    rarity: number,
    profile: EquipmentProfile,
    attackProfile?: AttackProfile,
  ) {
    super(id, name, CardType.Equipment, rarity);
    this.equipmentProfile = profile;
    this.attackProfile = attackProfile;
  }
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter((cs) => cs.type == CardType.Hull && cs.profileMatches(this.profile));
  }
  override get canAttack(): boolean {
    return Boolean(this.attackProfile);
  }
  override isInRange(range: number): boolean {
    return this.attackProfile.range >= range;
  }
  onUtilizaton() {}
  onRetraction() {}
  onStartTurn() {}
  onEndTurn(player: Player, source: CardStack) {}
  get profile(): CardProfile {
    return CardProfile.fromEquipmentProfile(this.equipmentProfile);
  }
  override attack(weapon: CardStack, target: CardStack): AttackResult {
    const attackingShip = weapon.rootCardStack;
    const match = attackingShip.player.match;
    let damage = this.attackProfile.damage;
    if (attackingShip.profile.speed + match.battle.range <= target.profile.speed)
      damage = Math.round(damage / 2);
    let attackResult = this.attackPointDefense(match, target, new AttackResult(damage));
    target.damage += attackResult.damage;
    return attackResult;
  }
  private attackPointDefense(match: Match, target: CardStack, attackResult: AttackResult): AttackResult {
    const defendingShips = match.battle.ships[match.getWaitingPlayerNo()];
    const bestPointDefense = defendingShips
      .flatMap((cs) => cs.cardStacks)
      .filter((cs) => cs.defenseAvailable && cs.profile.pointDefense)
      .sort((a, b) => a.profile.pointDefense - b.profile.pointDefense)
      .pop();
    if (attackResult.damage == 0) {
      return attackResult;
    } else if (this.attackProfile.pointDefense == 0 || !bestPointDefense) {
      return this.attackShield(target, attackResult);
    } else {
      const damageReduction = this.attackProfile.pointDefense * -bestPointDefense.profile.pointDefense;
      if (attackResult.damage >= damageReduction) bestPointDefense.defenseAvailable = false;
      const adjustedDamageReduction = Math.min(attackResult.damage, damageReduction);
      attackResult.pointDefense += adjustedDamageReduction;
      attackResult.damage -= adjustedDamageReduction;
      return this.attackPointDefense(match, target, attackResult);
    }
  }
  private attackShield(target: CardStack, attackResult: AttackResult): AttackResult {
    const bestShield = target.cardStacks
      .filter((cs) => cs.defenseAvailable && cs.profile.shield)
      .sort((a: CardStack, b: CardStack) => a.profile.shield - b.profile.shield)
      .pop();
    if (attackResult.damage == 0) {
      return attackResult;
    } else if (this.attackProfile.shield == 0 || !bestShield) {
      return this.attackArmour(target, attackResult);
    } else {
      const damageReduction = this.attackProfile.shield * -bestShield.profile.shield;
      if (attackResult.damage >= damageReduction) bestShield.defenseAvailable = false;
      const adjustedDamageReduction = Math.min(attackResult.damage, damageReduction);
      attackResult.shield += adjustedDamageReduction;
      attackResult.damage -= adjustedDamageReduction;
      return this.attackShield(target, attackResult);
    }
  }
  private attackArmour(target: CardStack, attackResult: AttackResult): AttackResult {
    const bestArmour = target.cardStacks
      .filter((cs) => cs.defenseAvailable && cs.profile.armour)
      .sort((a: CardStack, b: CardStack) => a.profile.armour - b.profile.armour)
      .pop();
    if (attackResult.damage == 0 || this.attackProfile.armour == 0 || !bestArmour) {
      return attackResult;
    } else {
      const damageReduction = this.attackProfile.armour * -bestArmour.profile.armour;
      if (attackResult.damage >= damageReduction) bestArmour.defenseAvailable = false;
      const adjustedDamageReduction = Math.min(attackResult.damage, damageReduction);
      attackResult.armour += adjustedDamageReduction;
      attackResult.damage -= adjustedDamageReduction;
      return this.attackArmour(target, attackResult);
    }
  }
}

export abstract class EquipmentCardRechargeable extends EquipmentCard {
  override get isRechargeable(): boolean {
    return true;
  }
}
