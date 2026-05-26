import Card from '../cards/card';
import Match from '../game_state/match';
import { DBCredential } from '../persistence/db_credentials';

export default class SocketData {
  user!: DBCredential;
  activeDeck: Card[] = [];
  playerNo?: number;
  match?: Match;
  constructor(user: DBCredential, activeDeck: Card[]) {
    this.user = user;
    this.activeDeck = activeDeck;
  }
}
