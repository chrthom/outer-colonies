import { Card, CardType } from './cards/card';
import { rules } from '../rules';

export default class Player {
    id!: string;
    name!: string;
    ready: boolean = false;
    deck!: Array<Card>;
    hand: Array<Card> = [];
    remainingActions = {};
    constructor(id: string, name: string, deck: Array<Card>) {
        this.id = id;
        this.name = name;
        this.deck = deck;
        this.resetRemainingActions();
    }
    totalActions(type: CardType): number {
        return rules.freeActions; // TODO: Dummy until logic is implemented
    }
    resetRemainingActions(): void {
        for (const ct in Object.keys(CardType)) {
            this.remainingActions[CardType[ct]] = this.totalActions(CardType[ct]);
        }
    }
    shuffleDeck(): void {
        this.deck = this.shuffle(this.deck);
    }
    drawCards(num: number): Array<Card> {
        const newCards = this.deck.splice(0, num);
        this.hand = this.hand.concat(newCards);
        return newCards;
    }
    private shuffle<T>(array: Array<T>): Array<T> {
        return array.sort(() => Math.random() -0.5)
    }
}
