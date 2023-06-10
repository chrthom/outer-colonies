import Card from '../cards/card';
import CardStack, { RootCardStack } from '../cards/card_stack';
import { CardType, Zone } from '../config/enums'
import { shuffle, spliceCardStackByUUID } from '../utils/utils';
import ColonyCard from '../cards/types/colony_card';
import ActionPool from '../cards/action_pool';
import Match from './match';

export default class Player {
    id!: string;
    name!: string;
    match!: Match;
    no!: number;
    ready: boolean = false;
    deck!: Card[];
    discardPile: Card[] = [];
    hand: CardStack[] = [];
    cardStacks!: CardStack[];
    actionPool!: ActionPool;
    constructor(id: string, name: string, match: Match, playerNo: number, deck: Card[]) {
        this.id = id;
        this.name = name;
        this.match = match;
        this.no = playerNo;
        this.deck = deck;
        this.cardStacks = [ new RootCardStack(new ColonyCard(), Zone.Colony, this) ];
        this.resetRemainingActions();
        //this.setDummyCardStacks(); // Just for testing
    }
    /*
    private setDummyCardStacks() {
        const ship1 = new RootCardStack(CardCollection.card160, Zone.Oribital, this);
        ship1.attachedCards.push(new AttachmentCardStack(CardCollection.card166, ship1));
        ship1.attachedCards.push(new AttachmentCardStack(CardCollection.card170, ship1));
        ship1.damage = 2;
        const ship2 = new RootCardStack(CardCollection.card348, Zone.Oribital, this);
        ship2.attachedCards.push(new AttachmentCardStack(CardCollection.card130, ship2));
        ship2.attachedCards.push(new AttachmentCardStack(CardCollection.card163, ship2));
        this.cardStacks.push(ship1, ship2);
    }
    */
    resetRemainingActions() {
        this.actionPool = this.getOriginalActions();
    }
    callBackShipsFromNeutralZone() {
        this.cardStacks.filter(cs => cs.zone == Zone.Neutral).forEach(cs => cs.zone = Zone.Oribital);
    }
    moveFlightReadyShipsToOrbit() {
        this.cardStacks.filter(cs => cs.zone == Zone.Colony && cs.isFlightReady()).forEach(cs => cs.zone = Zone.Oribital);
    }
    shuffleDeck() {
        this.deck = shuffle(this.deck);
    }
    drawCards(num: number) {
        this.takeCards(...this.pickCardsFromDeck(num));
    }
    discardCards(...cards: Card[]) {
        this.discardPile.push(...cards);
    }
    discardHandCards(...uuids: string[]) {
        uuids.forEach(uuid => this.discardPile.push(...spliceCardStackByUUID(this.hand, uuid).getCards()));
    }
    discardCardStacks(...uuids: string[]) {
        uuids.forEach(uuid => this.discardPile.push(...spliceCardStackByUUID(this.cardStacks, uuid).getCards()));
    }
    getColonyCardStack(): CardStack {
        return this.cardStacks.filter(c => c.card.type == CardType.Colony)[0];
    }
    isActivePlayer(): boolean {
        return this.no == this.match.activePlayerNo;
    }
    takeCards(...cards: Card[]) {
        this.hand.push(...cards.map(c => new RootCardStack(c, Zone.Hand, this)));
    }
    pickCardsFromDeck(num: number): Card[] {
        if (this.deck.length < num) this.match.gameResult.setWinnerByDeckDepletion(this);
        return this.deck.splice(0, Math.min(num, this.deck.length));
    }
    playHandCard(handCard: CardStack, target: CardStack) {
        this.actionPool.activate(handCard.type());
        spliceCardStackByUUID(this.hand, handCard.uuid)
        handCard.performImmediateEffect(target);
        if (!handCard.card.staysInPlay) {
            this.discardCards(handCard.card);
        } else if (target.type() == CardType.Colony) {
            handCard.zone = Zone.Colony;
            this.cardStacks.push(handCard);
        } else {
            target.attach(handCard);
        }
    }
    handCardLimit(): number {
        return this.getColonyCardStack() ? this.getColonyCardStack().profile().handCardLimit : 0;
    }
    getOriginalActions(): ActionPool {
        return this.cardStacks.map(cs => cs.actionPool()).reduce((a, b) => a.combine(b), new ActionPool());
    }
}
