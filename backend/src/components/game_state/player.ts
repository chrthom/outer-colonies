import Card from '../cards/card';
import CardStack from '../cards/card_stack';
import { Zone } from '../config/enums'
import { spliceCardStackByUUID } from '../utils/utils';
import CardCollection from '../cards/collection/card_collection';
import ColonyCard from '../cards/types/colony_card';
import ActionPool from '../cards/action_pool';

export default class Player {
    id!: string;
    name!: string;
    no!: number;
    ready: boolean = false;
    deck!: Array<Card>;
    discardPile: Array<Card> = [];
    hand: Array<CardStack> = [];
    cardStacks!: Array<CardStack>;
    actionPool!: ActionPool;
    constructor(id: string, name: string, no: number, deck: Array<Card>) {
        this.id = id;
        this.name = name;
        this.no = no;
        this.deck = deck;
        this.cardStacks = [ new CardStack(new ColonyCard(), Zone.Colony) ];
        this.resetRemainingActions();
        this.setDummyCardStacks(); // Just for testing
    }
    private setDummyCardStacks() {
        const ship1 = new CardStack(CardCollection.card160, Zone.Oribital);
        ship1.attachedCards.push(new CardStack(CardCollection.card166, Zone.Hand));
        const ship2 = new CardStack(CardCollection.card348, Zone.Oribital);
        ship2.attachedCards.push(new CardStack(CardCollection.card130, Zone.Hand));
        ship2.attachedCards.push(new CardStack(CardCollection.card163, Zone.Hand));
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
        this.hand.push(...this.pickCardsFromDeck(num).map(c => new CardStack(c, Zone.Hand)));
    }
    pickCardsFromDeck(num: number): Array<Card> {
        return this.deck.splice(0, num);
    }
    playCardToColonyZone(handCard: CardStack) {
        this.actionPool.activate(handCard.card.type);
        handCard.zone = Zone.Colony;
        this.cardStacks.push(spliceCardStackByUUID(this.hand, handCard.uuid));
    }
    attachCardToCardStack(handCard: CardStack, targetCardStack: CardStack) {
        this.actionPool.activate(handCard.card.type);
        targetCardStack.attachedCards.push(spliceCardStackByUUID(this.hand, handCard.uuid));
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
