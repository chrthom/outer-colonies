import Card from '../cards/card';
import CardStack, { RootCardStack } from '../cards/card_stack';
import { CardType, Zone, TurnPhase } from '../../shared/config/enums';
import { shuffle, spliceCardStackByUUID } from '../utils/helpers';
import ColonyCard from '../cards/types/colony_card';
import ActionPool from '../cards/action_pool';
import Match from './match';
import { InterventionTacticCard } from './intervention';

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
    this.actionPool = this.originalActions;
  }
  callBackShipsFromNeutralZone() {
    this.cardStacks.filter(cs => cs.zone == Zone.Neutral).forEach(cs => (cs.zone = Zone.Orbital));
  }
  moveFlightReadyShipsToOrbit() {
    this.cardStacks
      .filter(cs => cs.zone == Zone.Colony && cs.isFlightReady)
      .forEach(cs => (cs.zone = Zone.Orbital));
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
    uuids
      .map(uuid => spliceCardStackByUUID(this.hand, uuid)?.cards)
      .filter(c => !!c)
      .forEach(c => this.discardPile.push(...c));
  }
  discardCardStacks(...uuids: string[]) {
    uuids
      .map(uuid => spliceCardStackByUUID(this.cardStacks, uuid)?.cards)
      .filter(c => !!c)
      .forEach(c => this.discardPile.push(...c));
  }
  get colonyCardStack(): CardStack {
    const colonyCard = this.cardStacks.find(c => c.card.type == CardType.Colony);
    if (!colonyCard) throw Error('No colony card found');
    return colonyCard;
  }
  get isActivePlayer(): boolean {
    return this.no == this.match.activePlayerNo;
  }
  get isPendingPlayer(): boolean {
    return this.no == this.match.pendingActionPlayerNo;
  }
  takeCard(card: Card): Card {
    this.takeCards([card]);
    return card;
  }
  takeCards(cards: Card[]) {
    this.hand.push(...cards.map(c => new RootCardStack(c, Zone.Hand, this)));
  }
  pickCardFromDeck(): Card | undefined {
    const card = this.pickCardsFromDeck(1);
    return card.length == 1 ? card[0] : undefined;
  }
  pickCardsFromDeck(num: number): Card[] {
    if (this.deck.length < num) this.match.gameResult.setWinnerByDeckDepletion(this);
    return this.deck.splice(0, Math.min(num, this.deck.length));
  }
  pickCardsFromTopOfDiscardPile(num: number): Card[] {
    return num == 0 ? [] : this.discardPile.splice(-Math.min(num, this.discardPile.length));
  }
  playHandCard(handCard: CardStack, target: CardStack, optionalParameters?: number[]) {
    this.actionPool.activate(handCard.card);
    spliceCardStackByUUID(this.hand, handCard.uuid);
    if (handCard.type == CardType.Tactic) {
      this.match.highlightCard = handCard;
      new InterventionTacticCard(this.match, handCard, target, optionalParameters).init();
    } else {
      handCard.playHandCard(target, optionalParameters);
      this.match.checkToNextPhase();
    }
  }
  get handCardLimit(): number {
    return this.cardStacks.map(cs => cs.profile.handCardLimit).reduce((a, b) => a + b);
  }
  get originalActions(): ActionPool {
    return this.cardStacks.map(cs => cs.actionPool).reduce((a, b) => a.combine(b), new ActionPool());
  }
  get hasInsufficientEnergyCard(): boolean {
    return (
      this.isActivePlayer &&
      this.match.turnPhase == TurnPhase.Build &&
      this.cardStacks.some(cs => cs.hasInsufficientEnergy)
    );
  }
}
