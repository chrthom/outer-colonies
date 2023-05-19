import Card from '../cards/card';
import CardStack from '../cards/card_stack';
import { rules } from '../config/rules';
import { CardType, Zone } from '../config/enums'
import { spliceCardStackByUUID } from '../utils/utils';
import CardCollection from '../cards/collection/card_collection';

export default class Player {
    id!: string;
    name!: string;
    no!: number;
    ready: boolean = false;
    deck!: Array<Card>;
    discardPile: Array<Card> = [];
    hand: Array<CardStack> = [];
    cardStacks: Array<CardStack> = [];
    remainingActions = {};
    constructor(id: string, name: string, no: number, deck: Array<Card>) {
        this.id = id;
        this.name = name;
        this.no = no;
        this.deck = deck;
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
    totalActions(type: CardType): number {
        return rules.freeActions; // TODO: Dummy until logic is implemented
    }
    resetRemainingActions() {
        this.remainingActions[CardType.Colony] = this.totalActions(CardType.Colony);
        this.remainingActions[CardType.Hull] = this.totalActions(CardType.Hull);
        this.remainingActions[CardType.Equipment] = this.totalActions(CardType.Equipment);
        this.remainingActions[CardType.Tactic] = this.totalActions(CardType.Tactic);
        this.remainingActions[CardType.Orb] = this.totalActions(CardType.Orb);
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
        this.remainingActions[handCard.card.type]--;
        handCard.zone = Zone.Colony;
        this.cardStacks.push(spliceCardStackByUUID(this.hand, handCard.uuid));
    }
    attachCardToCardStack(handCard: CardStack, targetCardStack: CardStack) {
        this.remainingActions[handCard.card.type]--;
        targetCardStack.attachedCards.push(spliceCardStackByUUID(this.hand, handCard.uuid));
    }
    discardCardStack(uuid: string) {
        this.discardPile.push(...spliceCardStackByUUID(this.cardStacks, uuid).getCards());
    }
    private shuffle<T>(array: Array<T>): Array<T> {
        return array.sort(() => Math.random() -0.5)
    }
}
