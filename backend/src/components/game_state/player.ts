import Card from '../cards/card';
import CardStack from '../cards/card_stack';
import { rules } from '../config/rules';
import { CardType, Zone } from '../config/enums'
import { getCardStackByUUID, spliceCardStackByUUID } from '../utils/utils';

export default class Player {
    id!: string;
    name!: string;
    ready: boolean = false;
    deck!: Array<Card>;
    hand: Array<CardStack> = [];
    cardStacks: Array<CardStack> = [];
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
        this.remainingActions[CardType.Colony] = this.totalActions(CardType.Colony);
        this.remainingActions[CardType.Hull] = this.totalActions(CardType.Hull);
        this.remainingActions[CardType.Equipment] = this.totalActions(CardType.Equipment);
        this.remainingActions[CardType.Tactic] = this.totalActions(CardType.Tactic);
        this.remainingActions[CardType.Orb] = this.totalActions(CardType.Orb);
    }
    shuffleDeck(): void {
        this.deck = this.shuffle(this.deck);
    }
    drawCards(num: number): Array<CardStack> {
        const newCards = this.deck.splice(0, num).map((c: Card) => new CardStack(c, Zone.Hand));
        this.hand = this.hand.concat(newCards);
        return newCards;
    }
    playCardToColonyZone(handCard: CardStack): void {
        handCard.zone = Zone.Colony;
        this.cardStacks.push(spliceCardStackByUUID(this.hand, handCard.uuid));
    }
    private shuffle<T>(array: Array<T>): Array<T> {
        return array.sort(() => Math.random() -0.5)
    }
}
