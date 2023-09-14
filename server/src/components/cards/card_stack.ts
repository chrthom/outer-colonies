import Card from './card';
import CardProfile from './card_profile';
import { CardType, TurnPhase, Zone } from '../config/enums';
import { v4 as uuidv4 } from 'uuid';
import ActionPool from './action_pool';
import Player from '../game_state/player';
import { spliceCardStackByUUID } from '../utils/helpers';

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
    } else if (!this.card.isInRange(this.player.match.battle.range)) {
      console.log(`WARN: ${this.player.name} tried to attack with a card ${this.card.name} at wrong range`);
    } else {
      const attackResult = this.card.attack(this, target);
      this.player.match.battle.recentAttack = {
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
    return this.zone == Zone.Hand && this.validTargets.map(cs => cs.uuid).includes(cardStack.uuid);
  }
  get canBeRetracted(): boolean {
    const player = this.player;
    return (
      player.isActivePlayer() &&
      player.isPendingPlayer() &&
      player.match.turnPhase == TurnPhase.Build &&
      this.card.canBeRetracted(this.isRootCard) &&
      player.actionPool.toString() == player.getOriginalActions().toString()
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
  get rootCardStack(): CardStack {
    if (this.parentCardStack) return this.parentCardStack.rootCardStack;
    else return this;
  }
  get validTargets(): CardStack[] {
    if (this.zone == Zone.Hand) {
      return this.card.getValidTargets(this.player);
    } else {
      return []; // TODO: Reuse this method to determine valid attack targets in battle
    }
  }
  get hasInsufficientEnergy(): boolean {
    const rootCardStack = this.rootCardStack;
    if (this.type == CardType.Colony) {
      return false;
    } else if (rootCardStack.zone == Zone.Colony && rootCardStack.type == CardType.Infrastructure) {
      return this.card.profile.energy < 0 && this.player.getColonyCardStack().profile.energy < 0;
    } else {
      return this.card.profile.energy < 0 && rootCardStack.profile.energy < 0;
    }
  }
  get isFlightReady(): boolean {
    return this.card.isFlightReady(this.cards);
  }
  get isMissionReady(): boolean {
    return this.zone == Zone.Oribital && this.type == CardType.Hull && this.profile.speed > 0;
  }
  get isPlayable(): boolean {
    return this.zone == Zone.Hand && this.card.isPlayable(this.player);
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
    this.card.onEnterGame(this.player, target);
  }
  get profile(): CardProfile {
    if (this.type == CardType.Colony) {
      const handCardLimitOutsideColonyZone = this.player.cardStacks // Silos in orbit also increase hand card limit
        .filter(cs => cs.zone != Zone.Colony)
        .filter(cs => cs.type == CardType.Infrastructure)
        .map(cs => cs.profile.handCardLimit)
        .reduce((a, b) => a + b, 0);
      const colonyCardsProfile = this.player.cardStacks
        .filter(cs => cs.zone == Zone.Colony)
        .filter(cs => [CardType.Orb, CardType.Infrastructure].includes(cs.type))
        .map(cs => cs.profile)
        .reduce((a, b) => CardProfile.combineCardProfiles(a, b), new CardProfile());
      colonyCardsProfile.handCardLimit += handCardLimitOutsideColonyZone;
      colonyCardsProfile.hp = 0; // Else infrastructure cards' HP would increase the colony's HP
      return CardProfile.combineCardProfiles(colonyCardsProfile, this.card.profile);
    } else {
      return this.cards.map(c => c.profile).reduce((a, b) => CardProfile.combineCardProfiles(a, b));
    }
  }
  profileMatches(c: CardProfile): boolean {
    return CardProfile.isValid(CardProfile.combineCardProfiles(this.profile, c));
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
