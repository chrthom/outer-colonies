import Card from '../cards/card'
import Match from '../game_state/match'
import CardCollection from '../cards/collection/card_collection';

export default class SocketData {
    name!: string;
    activeDeck!: Card[];
    playerNo: number;
    match: Match;
    constructor(name: string) {
        this.name = name;
        this.activeDeck = CardCollection.pickRandomDeck();
    }
    opponentPlayerNo(): number {
        return this.match.opponentPlayerNo(this.playerNo);
    }
}
