import Card from '../cards/card';
import Match from '../game_state/match';
import { DBCredential } from '../persistence/db_credentials';

export default class SocketData {
  user!: DBCredential;
  activeDeck: Card[] = [];
  playerNo?: number;
  match?: Match;
  /** Timestamp (ms since epoch) when the client joined the matchmaking search; used for the search timeout */
  searchStartedAt: number = Date.now();
  constructor(user: DBCredential, activeDeck: Card[]) {
    this.user = user;
    this.activeDeck = activeDeck;
  }
}
