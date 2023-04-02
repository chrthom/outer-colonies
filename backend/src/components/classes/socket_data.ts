import Cards from './cards';
import { Card } from '../cards/card'
import Match from './match'

const defaultDeck = [
    Cards.card160,
    Cards.card160,
    Cards.card160,
    Cards.card160,
    Cards.card160,
    Cards.card348,
    Cards.card348,
    Cards.card348,
    Cards.card348,
    Cards.card348,
    Cards.card130,
    Cards.card130,
    Cards.card130,
    Cards.card130,
    Cards.card130,
    Cards.card166,
    Cards.card166,
    Cards.card166,
    Cards.card166,
    Cards.card166,
    Cards.card163,
    Cards.card163,
    Cards.card163,
    Cards.card163,
];

export default class SocketData {
    name!: string;
    activeDeck!: Array<Card>;
    playerNo: number;
    match: Match;
    constructor(name: string) {
        this.name = name;
        this.activeDeck = defaultDeck;
    }
    opponentPlayerNo(): number {
        return this.playerNo == 0 ? 1 : 0;
    }
}
