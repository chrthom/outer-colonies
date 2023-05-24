import Cards from '../cards/collection/card_collection';
import Card from '../cards/card'
import Match from '../game_state/match'

const defaultDeck = [
    Cards.card160,
    Cards.card160,
    Cards.card160,
    Cards.card348,
    Cards.card348,
    Cards.card348,
    Cards.card446,
    Cards.card446,
    Cards.card130,
    Cards.card130,
    Cards.card166,
    Cards.card166,
    Cards.card163,
    Cards.card170,
    Cards.card135,
    Cards.card135,
    Cards.card185,
    Cards.card348,
    Cards.card242,
    Cards.card453,
    Cards.card232,
    Cards.card232,
    Cards.card141,
    Cards.card141
];

export default class SocketData {
    name!: string;
    activeDeck!: Card[];
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
