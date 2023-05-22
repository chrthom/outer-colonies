import Card from '../cards/card';
import CardStack, { AttachmentCardStack, RootCardStack } from '../cards/card_stack';
import { Zone } from '../config/enums'
import { spliceCardStackByUUID } from '../utils/utils';
import CardCollection from '../cards/collection/card_collection';
import ColonyCard from '../cards/types/colony_card';
import ActionPool from '../cards/action_pool';
import Match from './match';

export default class Player {
    id!: string;
    name!: string;
    match!: Match;
    no!: number;
    ready: boolean = false;
    deck!: Array<Card>;
    discardPile: Array<Card> = [];
    hand: Array<CardStack> = [];
    cardStacks!: Array<CardStack>;
    actionPool!: ActionPool;
    constructor(id: string, name: string, match: Match, playerNo: number, deck: Array<Card>) {
        this.id = id;
        this.name = name;
        this.match = match;
        this.no = playerNo;
        this.deck = deck;
        this.cardStacks = [ new RootCardStack(new ColonyCard(), Zone.Colony, this) ];
        this.resetRemainingActions();
        this.setDummyCardStacks(); // Just for testing
    }
    private setDummyCardStacks() {
        const ship1 = new RootCardStack(CardCollection.card160, Zone.Oribital, this);
        ship1.attachedCards.push(new AttachmentCardStack(CardCollection.card166, ship1));
        const ship2 = new RootCardStack(CardCollection.card348, Zone.Oribital, this);
        ship2.attachedCards.push(new AttachmentCardStack(CardCollection.card130, ship2));
        ship2.attachedCards.push(new AttachmentCardStack(CardCollection.card163, ship2));
        this.cardStacks.push(ship1, ship2);
    }
    resetRemainingActions() {
        this.actionPool = this.cardStacks.map(cs => cs.actionPool()).reduce((a, b) => a.combine(b));
    }
    callBackShipsFromNeutralZone() {
        this.cardStacks.filter(cs => cs.zone == Zone.Neutral).forEach(cs => cs.zone = Zone.Oribital);
    }
    moveFlightReadyShipsToOrbit() {
        this.cardStacks.filter(cs => cs.zone == Zone.Colony && cs.isFlightReady()).forEach(cs => cs.zone = Zone.Oribital);
    }
    shuffleDeck() {
        this.deck = this.shuffle(this.deck);
    }
    drawCards(num: number) {
        // TODO: Check if no cards are left in deck
        this.hand.push(...this.pickCardsFromDeck(num).map(c => new RootCardStack(c, Zone.Hand, this)));
    }
    pickCardsFromDeck(num: number): Array<Card> {
        return this.deck.splice(0, num);
    }
    playCardToColonyZone(handCard: CardStack) {
        this.actionPool.activate(handCard.type()); // TODO: Somehow any number of tactic cards can be played - fix it!
        handCard.zone = Zone.Colony;
        this.cardStacks.push(spliceCardStackByUUID(this.hand, handCard.uuid));
    }
    attachCardToCardStack(handCard: CardStack, targetCardStack: CardStack) {
        this.actionPool.activate(handCard.type());
        targetCardStack.attach(spliceCardStackByUUID(this.hand, handCard.uuid));
    }
    discardCardStack(uuid: string) {
        this.discardPile.push(...spliceCardStackByUUID(this.cardStacks, uuid).getCards());
    }
    discardHandCard(uuid: string) {
        this.discardPile.push(spliceCardStackByUUID(this.hand, uuid).card);
    }
    private shuffle<T>(array: Array<T>): Array<T> {
        return array.sort(() => Math.random() -0.5)
    }
}
