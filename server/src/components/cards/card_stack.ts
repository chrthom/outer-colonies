import Card from './card';
import CardProfile from './card_profile';
import { CardType, Intervention, TurnPhase, Zone } from '../../shared/config/enums';
import { v4 as uuidv4 } from 'uuid';
import ActionPool from './action_pool';
import Player from '../game_state/player';
import { spliceCardStackByUUID } from '../utils/helpers';
import Match from '../game_state/match';

export default class CardStack {
  card!: Card;
  zone: Zone;
  uuid!: string;
  attachedCardStacks: CardStack[] = [];
  damage: number = 0;
  attackAvailable: boolean = false;
  defenseAvailable: boolean = false;
  protected parentCardStack: CardStack;
  protected parentPlayer: Player;
  constructor(card: Card) {
    this.card = card;
    this.uuid = uuidv4();
  }
  get actionPool(): ActionPool {
    return this.cards.map(c => c.actionPool).reduce((a, b) => a.combine(b));
  }
  attach(cardStack: CardStack) {
    cardStack.parentCardStack = this;
    this.attachedCardStacks.push(cardStack);
  }
  attack(target: CardStack) {
    if (!this.attackAvailable) {
      console.log(
        `WARN: ${this.player.name} tried to attack with a card ${this.card.name}, which cannot attack`
      );
    } else if (!this.card.isInRange(this.match.battle.range)) {
      console.log(`WARN: ${this.player.name} tried to attack with a card ${this.card.name} at wrong range`);
    } else {
      const attackResult = this.card.attack(this, target);
      this.match.battle.recentAttack = {
        sourceUUID: this.rootCardStack.uuid,
        sourceIndex: this.rootCardStack.cardStacks.findIndex(cs => cs.uuid == this.uuid),
        targetUUID: target.uuid,
        pointDefense: attackResult.pointDefense,
        shield: attackResult.shield,
        armour: attackResult.armour,
        damage: attackResult.damage
      };
      this.attackAvailable = false;
    }
  }
  canAttack(player: Player): boolean {
    return (
      this.attackAvailable &&
      this.card.isInRange(player.match.battle.range) &&
      this.rootCardStack.isFlightReady
    );
  }
  canBeAttachedTo(cardStack: CardStack): boolean {
    return this.validTargets.map(cs => cs.uuid).includes(cardStack.uuid);
  }
  get canBeRetracted(): boolean {
    return (
      this.player.isActivePlayer &&
      this.player.isPendingPlayer &&
      this.match.turnPhase == TurnPhase.Build &&
      this.card.canBeRetracted(this.isRootCard) &&
      this.player.actionPool.toString() == this.player.originalActions.toString()
    );
  }
  combatPhaseReset(initial: boolean) {
    this.attachedCardStacks.forEach(cs => cs.combatPhaseReset(initial));
    if (initial || this.card.isRechargeable) {
      if (this.card.canAttack) this.attackAvailable = true;
      if (this.card.canDefend) this.defenseAvailable = true;
    }
  }
  get cards(): Card[] {
    return this.cardStacks.map(cs => cs.card);
  }
  get cardStacks(): CardStack[] {
    return this.attachedCardStacks.flatMap(cs => cs.cardStacks).concat(this);
  }
  get player(): Player {
    return this.parentCardStack ? this.parentCardStack.player : this.parentPlayer;
  }
  get match(): Match {
    return this.player.match;
  }
  get rootCardStack(): CardStack {
    if (this.parentCardStack) return this.parentCardStack.rootCardStack;
    else return this;
  }
  get validTargets(): CardStack[] {
    const canIntervene = this.match.intervention
      && this.card.canIntervene(this.match.intervention.type);
    const canPlayInBuildPhase = !this.match.intervention
      && this.player.isActivePlayer
      && this.match.turnPhase == TurnPhase.Build
      && !this.player.hasInsufficientEnergyCard;
    return this.player.isPendingPlayer
      && this.zone == Zone.Hand
      && (canIntervene || canPlayInBuildPhase)
      && this.player.actionPool.hasActionFor(this.card)
      ? this.card.getValidTargets(this.player)
      : [];
  }
  get hasInsufficientEnergy(): boolean {
    if (this.type == CardType.Colony) {
      return false;
    } else if (this.rootCardStack.zone == Zone.Colony && this.rootCardStack.type == CardType.Infrastructure) {
      return this.card.profile.energy < 0 && this.player.colonyCardStack.profile.energy < 0;
    } else {
      return this.card.profile.energy < 0 && this.rootCardStack.profile.energy < 0;
    }
  }
  get isFlightReady(): boolean {
    return this.card.isFlightReady(this.cards);
  }
  get deactivationPriority(): number {
    return this.card.deactivationPriority(this);
  }
  get isMissionReady(): boolean {
    return this.zone == Zone.Oribital && this.type == CardType.Hull && this.profile.speed > 0;
  }
  get hasValidTargets(): boolean {
    return this.validTargets.length > 0;
  }
  onDestruction() {
    this.card.onDestruction(this.player);
    this.attachedCardStacks.forEach(cs => cs.onDestruction());
  }
  onStartTurn() {
    this.card.onStartTurn(this.player);
    this.attachedCardStacks.forEach(cs => cs.onStartTurn());
  }
  onEndTurn() {
    this.card.onEndTurn(this.player, this);
    this.attachedCardStacks.forEach(cs => cs.onEndTurn());
  }
  performImmediateEffect(target: CardStack) {
    this.card.onEnterGame(this.player, target, this);
  }
  get profile(): CardProfile {
    const profile = this.cards.map(c => c.profile).reduce((a, b) => a.combine(b));
    if (this.type == CardType.Colony) {7
      profile.energy = this.player.cardStacks
        .filter(cs => cs.zone == Zone.Colony)
        .filter(cs => cs.type == CardType.Infrastructure)
        .map(cs => cs.profile.energy)
        .reduce((a, b) => a + b, 0);
    }
    return profile;
  }
  profileMatches(c: CardProfile): boolean {
    return this.profile.combine(c).isValid;
  }
  canDefend(target: CardStack): boolean {
    return (
      this.defenseAvailable &&
      this.card.canDefend &&
      (this.rootCardStack.uuid == target.uuid || // Defend self
        (this.card.profile.pointDefense > 0 && this.rootCardStack.zone != Zone.Colony) || // Point defend of active ships in combat
        (target.zone == Zone.Colony && this.card.isColonyDefense) || // Colony defense for colony zone targets
        (target.type == CardType.Colony && this.zone == Zone.Colony)) // Defense of colony card in colony zone
    );
  }
  discard() {
    this.removeCardStack();
    this.player.discardCards(...this.cards);
  }
  retract() {
    this.removeCardStack();
    this.player.takeCards(this.cards.filter(c => c.canBeRetracted(this.isRootCard)));
    this.player.discardCards(...this.cards.filter(c => !c.canBeRetracted(this.isRootCard)));
  }
  get isInBattle(): boolean {
    return this.match.battle.ships[this.player.no].some(cs => cs.uuid == this.uuid);
  }
  get type(): CardType {
    return this.card.type;
  }
  private removeCardStack() {
    if (this.isRootCard) {
      spliceCardStackByUUID(this.player.cardStacks, this.uuid);
    } else {
      spliceCardStackByUUID(this.parentCardStack.attachedCardStacks, this.uuid);
    }
    this.cards.forEach(c => c.onLeaveGame(this.player));
  }
  private get isRootCard() {
    return !this.parentCardStack;
  }
}

export class RootCardStack extends CardStack {
  constructor(card: Card, zone: Zone, player: Player) {
    super(card);
    this.zone = zone;
    this.parentPlayer = player;
  }
}

export class AttachmentCardStack extends CardStack {
  constructor(card: Card, parentCardStack: CardStack) {
    super(card);
    this.parentCardStack = parentCardStack;
  }
}
