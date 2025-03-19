import Card, { AttackResult, CardRarity } from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';
import { AttackProfile } from '../card_profile';
import { CardType } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import TacticCard from './tactic_card';

export default abstract class EquipmentCard extends Card {
  readonly attackProfile?: AttackProfile;
  constructor(
    id: number,
    name: string,
    rarity: CardRarity,
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
    return !!this.attackProfile && this.attackProfile.range >= range;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack) {}
  onLeaveGame() {}
  onStartTurn() {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEndTurn(player: Player, source: CardStack) {}
  override attack(weapon: CardStack, target: CardStack, interventionCard?: TacticCard): AttackResult {
    if (!this.attackProfile) return new AttackResult(0);
    const attackingShip = weapon.rootCardStack;
    const match = attackingShip.player.match;
    let damage = this.attackDamageBeforeReductions(target);
    if (interventionCard) {
      damage = interventionCard.adjustedAttackDamageByIntervention(damage);
    }
    if (target.isFlightReady && attackingShip.profile.speed + match.battle.range < target.profile.speed) {
      damage = Math.round(damage / 2);
    }
    const attackResult = this.attackStep(
      target,
      this.attackProfile,
      match.battle.ships[match.waitingPlayerNo],
      new AttackResult(damage)
    );
    attackResult.damage = this.attackDamageAfterReductions(target, attackResult.damage);
    target.damage += attackResult.damage;
    return attackResult;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected attackDamageBeforeReductions(target: CardStack) {
    return this.attackProfile?.damage ?? 0;
  }
  protected attackDamageAfterReductions(target: CardStack, damage: number) {
    return damage;
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
