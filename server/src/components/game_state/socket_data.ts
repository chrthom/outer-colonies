import Card from '../cards/card';
import Match from '../game_state/match';
import { opponentPlayerNo } from '../utils/helpers';
import { DBCredential } from '../persistence/db_credentials';
import DBDecksDAO from '../persistence/db_decks';
import CardCollection from '../cards/collection/card_collection';

export default class SocketData {
  user!: DBCredential;
  activeDeck: Card[] = [];
  playerNo: number;
  match: Match;
  constructor(user: DBCredential) {
    this.user = user;
    this.activeDeck = CardCollection.pickRandomDeck();
    DBDecksDAO.getByUserId(user.userId).then((cards) => {
      this.activeDeck = cards.filter((c) => c.inUse).map((c) => CardCollection.cards[c.cardId]);
    });
  }
  opponentPlayerNo(): number {
    return opponentPlayerNo(this.playerNo);
  }
}
