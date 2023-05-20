import Cards from '../cards/collection/card_collection';
import Card from '../cards/card'
import Match from '../game_state/match'

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
    Cards.card135,
];

export default class SocketData {
    name!: string;
    activeDeck!: Array<Card>;
    playerNo: number;
    match: Match;
    constructor(name: string) {
        this.name = name;
        this.activeDeck = defaultDeck.slice();
    }
    opponentPlayerNo(): number {
        return this.match.opponentPlayerNo(this.playerNo);
    }
}
