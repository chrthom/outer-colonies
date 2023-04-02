import { Card } from '../cards/card';

export default class Player {
    id!: string;
    name!: string;
    ready!: boolean;
    deck!: Array<Card>;
    hand!: Array<Card>;
    constructor(id: string, name: string, deck: Array<Card>) {
        this.id = id;
        this.name = name;
        this.ready = false;
        this.deck = deck;
        this.hand = [];
    }
}