import CardStack from './card_stack';
import CardProfile, { CardProfileConfig } from './card_profile';
import { CardType, Zone, CardDurability, InterventionType } from '../../shared/config/enums';
import ActionPool from './action_pool';
import Player from '../game_state/player';
import TacticCard from './types/tactic_card';

export default abstract class Card {
  readonly id!: number;
  readonly name!: string;
  readonly type!: CardType;
  readonly rarity!: number;
  readonly profile!: CardProfile;
  constructor(id: number, name: string, type: CardType, rarity: number, profile?: CardProfileConfig) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.rarity = rarity;
    this.profile = new CardProfile(profile);
  }
  abstract getValidTargets(player: Player): CardStack[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  attack(attackingShip: CardStack, target: CardStack, interventionCard?: TacticCard): AttackResult {
    return new AttackResult(0);
  }
  get canAttack(): boolean {
    return false;
  }
  get canDefend(): boolean {
    const p = this.profile;
    return [p.armour, p.shield, p.pointDefense].some(n => n > 0);
  }
  canIntervene(intervention: InterventionType): boolean {
    return intervention == this.interventionType;
  }
  protected get interventionType(): InterventionType | undefined {
    return undefined;
  }
  deactivationPriority(cardStack: CardStack): number {
    let priority = this.instantRecharge ? 0 : 15;
    priority += Math.max(this.profile.armour, this.profile.shield, this.profile.pointDefense) * 4;
    priority += cardStack.zone == Zone.Colony ? 2 : 0;
    priority += this.isColonyDefense ? 0 : 1;
    return priority;
  }
  get isColonyDefense(): boolean {
    return false;
  }
  get durability(): CardDurability {
    return CardDurability.Permanent;
  }
  get isAttachSelfManaging(): boolean {
    return false;
  }
  get isRechargeable(): boolean {
    return false;
  }
  get instantRecharge(): boolean {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canBeRetracted(isRootCard: boolean): boolean {
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isInRange(range: number): boolean {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFlightReady(cards: Card[]): boolean {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDestruction(player: Player) {}
  abstract onEnterGame(player: Player, target: CardStack, cardStack: CardStack): void;
  abstract onLeaveGame(player: Player): void;
  abstract onStartTurn(player: Player): void;
  abstract onEndTurn(player: Player, source: CardStack): void;
  get actionPool(): ActionPool {
    return new ActionPool();
  }
  protected addToActionPool(player: Player) {
    player.actionPool.push(...this.actionPool.pool);
  }
  protected removeFromActionPool(player: Player) {
    player.actionPool.remove(...this.actionPool.pool);
  }
}

export class AttackResult {
  pointDefense: number = 0;
  shield: number = 0;
  armour: number = 0;
  damage: number = 0;
  constructor(initialDamage: number) {
    this.damage = initialDamage;
  }
}
