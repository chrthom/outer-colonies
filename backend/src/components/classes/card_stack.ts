import { Card, CardType } from './cards/card';

export enum Zone {
    Colony = 'colony',
    Oribital = 'orbital',
    Neutral = 'neutral'
}

export class CardStack {
    card!: Card;
    attachedCards: Array<CardStack> = [];
    damage: number = 0;
    zone: Zone = Zone.Colony;
    constructor(card: Card) {
        this.card = card;
    }
}