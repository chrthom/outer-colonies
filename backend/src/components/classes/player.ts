import { Card } from '../cards/card';

export default class Player {
    name!: string;
    deck!: Array<Card>;
    ready!: boolean;
    constructor(name: string, deck: Array<Card>) {
        this.name = name;
        this.deck = deck;
        this.ready = false;
    }
}