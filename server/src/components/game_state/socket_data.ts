import Card from '../cards/card'
import Match from '../game_state/match'
import CardCollection from '../cards/collection/card_collection';
import { opponentPlayerNo } from '../utils/helpers';
import { DBCredential } from '../persistence/db_objects';

export default class SocketData {
    user!: DBCredential;
    activeDeck!: Card[];
    playerNo: number;
    match: Match;
    constructor(user: DBCredential) {
        this.user = user;
        this.activeDeck = CardCollection.pickRandomDeck();
    }
    opponentPlayerNo(): number {
        return opponentPlayerNo(this.playerNo);
    }
}
