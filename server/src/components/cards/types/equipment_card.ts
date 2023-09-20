import Card, { AttackResult } from '../card';
import CardProfile, { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';
import { AttackProfile } from '../card_profile';
import { CardType, DefenseType } from '../../config/enums';
import Player from '../../game_state/player';

export default abstract class EquipmentCard extends Card {
  readonly attackProfile?: AttackProfile;
  constructor(
    id: number,
    name: string,
    rarity: number,
    profile?: CardProfileConfig,
    attackProfile?: AttackProfile
  ) {
    super(id, name, CardType.Equipment, rarity, profile);
    this.attackProfile = attackProfile;
  }
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.type == CardType.Hull && cs.profileMatches(this.profile));
  }
  override get canAttack(): boolean {
    return Boolean(this.attackProfile);
  }
  override isInRange(range: number): boolean {
    return this.attackProfile.range >= range;
  }
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEndTurn(player: Player, source: CardStack) {}
  override attack(weapon: CardStack, target: CardStack): AttackResult {
    const attackingShip = weapon.rootCardStack;
    const match = attackingShip.player.match;
    let damage = this.attackDamageBeforeReductions(target);
    if (attackingShip.profile.speed + match.battle.range < target.profile.speed)
      damage = Math.round(damage / 2);
    const attackResult = this.attackStep(
      target,
      match.battle.ships[match.getWaitingPlayerNo()],
      new AttackResult(damage)
    );
    attackResult.damage = this.attackDamageAfterReductions(target, attackResult.damage);
    target.damage += attackResult.damage;
    return attackResult;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected attackDamageBeforeReductions(target: CardStack) {
    return this.attackProfile.damage;
  }
  protected attackDamageAfterReductions(target: CardStack, damage: number) {
    return damage;
  }
  private attackStep(
    target: CardStack,
    defendingShips: CardStack[],
    attackResult: AttackResult,
    defenseType: DefenseType = DefenseType.PointDefense
  ): AttackResult {
    const fromProfile = (p: AttackProfile | CardProfile) => {
      switch (defenseType) {
        case DefenseType.Armour:
          return p.armour;
        case DefenseType.Shield:
          return p.shield;
        default:
          return p.pointDefense;
      }
    };
    const bestDefense = defendingShips
      .flatMap(cs => cs.cardStacks)
      .filter(cs => fromProfile(cs.card.profile) && cs.canDefend(target))
      .sort((a, b) => fromProfile(a.card.profile) - fromProfile(b.card.profile))
      .pop();
    if (attackResult.damage == 0) {
      return attackResult;
    } else if (fromProfile(this.attackProfile) == 0 || !bestDefense) {
      switch (defenseType) {
        case DefenseType.Armour:
          return attackResult;
        case DefenseType.Shield:
          return this.attackStep(target, defendingShips, attackResult, DefenseType.Armour);
        default:
          return this.attackStep(target, defendingShips, attackResult, DefenseType.Shield);
      }
    } else {
      const damageReduction = fromProfile(this.attackProfile) * -fromProfile(bestDefense.profile);
      if (attackResult.damage >= damageReduction) bestDefense.defenseAvailable = false;
      const adjustedDamageReduction = Math.min(attackResult.damage, damageReduction);
      switch (defenseType) {
        case DefenseType.Armour:
          attackResult.armour += adjustedDamageReduction;
          break;
        case DefenseType.Shield:
          attackResult.shield += adjustedDamageReduction;
          break;
        default:
          attackResult.pointDefense += adjustedDamageReduction;
      }
      attackResult.damage -= adjustedDamageReduction;
      return this.attackStep(target, defendingShips, attackResult, defenseType);
    }
  }
}

export abstract class EquipmentCardColonyKiller extends EquipmentCard {
  protected override attackDamageAfterReductions(target: CardStack, damage: number) {
    return target.type == CardType.Colony ? damage * 2 : damage;
  }
}

export abstract class EquipmentCardColonyKillerRechargeable extends EquipmentCardColonyKiller {
  override get isRechargeable(): boolean {
    return true;
  }
}

export abstract class EquipmentCardRechargeable extends EquipmentCard {
  override get isRechargeable(): boolean {
    return true;
  }
}
