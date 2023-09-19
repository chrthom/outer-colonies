import CardStack from './card_stack';
import CardProfile from './card_profile';
import { CardType, TurnPhase } from '../config/enums';
import ActionPool from './action_pool';
import Player from '../game_state/player';

export default abstract class Card {
  readonly id!: number;
  readonly name!: string;
  readonly type!: CardType;
  readonly rarity!: number;
  constructor(id: number, name: string, type: CardType, rarity: number) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.rarity = rarity;
  }
  abstract getValidTargets(player: Player): CardStack[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  attack(attackingShip: CardStack, target: CardStack): AttackResult {
    return new AttackResult(0);
  }
  get canAttack(): boolean {
    return false;
  }
  get canDefend(): boolean {
    const p = this.profile;
    return [p.armour, p.shield, p.pointDefense].some(n => n > 0);
  }
  get isPermanent(): boolean {
    return true;
  }
  get isRechargeable(): boolean {
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
  isPlayable(player: Player): boolean {
    return (
      player.actionPool.hasActionFor(this) &&
      player.no == player.match.activePlayerNo &&
      player.match.turnPhase == TurnPhase.Build &&
      this.getValidTargets(player).length > 0
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFlightReady(cards: Card[]): boolean {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDestruction(player: Player) {}
  abstract onEnterGame(player: Player, target: CardStack): void;
  abstract onLeaveGame(player: Player): void;
  abstract onStartTurn(player: Player): void;
  abstract onEndTurn(player: Player, source: CardStack): void;
  abstract get profile(): CardProfile;
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
