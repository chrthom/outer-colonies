import Card from '../cards/card';
import CardStack, { RootCardStack } from '../cards/card_stack';
import { CardType, Zone } from '../config/enums';
import { shuffle, spliceCardStackByUUID } from '../utils/helpers';
import ColonyCard from '../cards/types/colony_card';
import ActionPool from '../cards/action_pool';
import Match from './match';

export default class Player {
  socketId!: string;
  name!: string;
  match!: Match;
  no!: number;
  ready: boolean = false;
  deck!: Card[];
  discardPile: Card[] = [];
  hand: CardStack[] = [];
  cardStacks!: CardStack[];
  actionPool!: ActionPool;
  constructor(socketd: string, name: string, match: Match, playerNo: number, deck: Card[]) {
    this.socketId = socketd;
    this.name = name;
    this.match = match;
    this.no = playerNo;
    this.deck = deck;
    this.cardStacks = [new RootCardStack(new ColonyCard(), Zone.Colony, this)];
    this.resetRemainingActions();
  }
  resetRemainingActions() {
    this.actionPool = this.getOriginalActions();
  }
  callBackShipsFromNeutralZone() {
    this.cardStacks.filter(cs => cs.zone == Zone.Neutral).forEach(cs => (cs.zone = Zone.Oribital));
  }
  moveFlightReadyShipsToOrbit() {
    this.cardStacks
      .filter(cs => cs.zone == Zone.Colony && cs.isFlightReady)
      .forEach(cs => (cs.zone = Zone.Oribital));
  }
  shuffleDeck() {
    this.deck = shuffle(this.deck);
  }
  drawCards(num: number) {
    this.takeCards(this.pickCardsFromDeck(num));
  }
  discardCards(...cards: Card[]) {
    this.discardPile.push(...cards);
  }
  discardHandCards(...uuids: string[]) {
    uuids.forEach(uuid => this.discardPile.push(...spliceCardStackByUUID(this.hand, uuid).cards));
  }
  discardCardStacks(...uuids: string[]) {
    uuids.forEach(uuid => this.discardPile.push(...spliceCardStackByUUID(this.cardStacks, uuid).cards));
  }
  getColonyCardStack(): CardStack {
    return this.cardStacks.filter(c => c.card.type == CardType.Colony)[0];
  }
  isActivePlayer(): boolean {
    return this.no == this.match.activePlayerNo;
  }
  isPendingPlayer(): boolean {
    return this.no == this.match.actionPendingByPlayerNo;
  }
  takeCards(cards: Card[], originUUID?: string) {
    this.hand.push(...cards.map(c => new RootCardStack(c, Zone.Hand, this)));
  }
  pickCardsFromDeck(num: number): Card[] {
    if (this.deck.length < num) this.match.gameResult.setWinnerByDeckDepletion(this);
    return this.deck.splice(0, Math.min(num, this.deck.length));
  }
  pickCardsFromTopOfDiscardPile(num: number): Card[] {
    return num == 0 ? [] : this.discardPile.splice(-Math.min(num, this.discardPile.length));
  }
  playHandCard(handCard: CardStack, target: CardStack) {
    this.actionPool.activate(handCard.card);
    spliceCardStackByUUID(this.hand, handCard.uuid);
    handCard.performImmediateEffect(target);
    if (!handCard.card.isPermanent) {
      this.discardCards(handCard.card);
    } else if (target.type == CardType.Colony && handCard.type != CardType.Orb) {
      handCard.zone = Zone.Colony;
      this.cardStacks.push(handCard);
    } else {
      target.attach(handCard);
    }
  }
  handCardLimit(): number {
    return this.getColonyCardStack() ? this.getColonyCardStack().profile.handCardLimit : 0;
  }
  getOriginalActions(): ActionPool {
    return this.cardStacks.map(cs => cs.actionPool).reduce((a, b) => a.combine(b), new ActionPool());
  }
}
