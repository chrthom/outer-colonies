import SocketData from './game_state/socket_data';
import Match from './game_state/match';
import { MsgTypeInbound, MsgTypeOutbound } from '../shared/config/enums';
import { v4 as uuidv4 } from 'uuid';
import { Server, Socket } from 'socket.io';
import ClientGameParams from '../shared/interfaces/client_game_params';
import DBCredentialsDAO from './persistence/db_credentials';
import DBDecksDAO from './persistence/db_decks';
import CardCollection from './cards/collection/card_collection';

export const matchmakingRoom = 'matchmaking';
const gameRoomPrefix = 'match';

export function matchMakingSocketListeners(io: Server, socket: Socket): void {
  socket.on(MsgTypeInbound.Login, async (sessionToken: string) => {
    if (!sessionToken) return;
    try {
      const user = await DBCredentialsDAO.getBySessionToken(sessionToken);
      if (!user) {
        console.log(`WARN: Invalid session token ${sessionToken} provided`);
        return;
      }
      const deckCards = await DBDecksDAO.getByUserId(user.userId);
      const activeDeck = deckCards
        .filter(c => c.inUse)
        .map(c => CardCollection.cards[c.cardId as keyof typeof CardCollection.cards]);
      console.log(`Player logged in: ${user.username}`);
      socket.data = new SocketData(user, activeDeck);
      socket.join(matchmakingRoom);
      socket.emit(MsgTypeOutbound.Matchmaking, 'search', clientsInMatchMaking(io).size - 1);
    } catch (err) {
      console.log(`ERROR: Login failed for session token ${sessionToken}: ${err}`);
    }
  });
}

export function matchMakingCron(io: Server) {
  const clients: Socket[] = Array.from(clientsInMatchMaking(io))
    .map(cid => io.sockets.sockets.get(cid))
    .filter((c): c is Socket => !!c);
  const numClients = clients.length;
  if (clients.length > 1) {
    console.log(`Performing matchmaking for ${numClients} clients...`);
    let partnerSocket = null;
    for (const client of clients) {
      client.emit(matchmakingRoom, 'search', numClients - 1);
      if (partnerSocket) initGame(io, client, partnerSocket);
      else partnerSocket = client;
    }
  }
}

function clientsInMatchMaking(io: Server): Set<string> {
  return io.sockets.adapter.rooms.get(matchmakingRoom) ?? new Set();
}

function initGame(io: Server, socket1: Socket, socket2: Socket): void {
  socket1.leave(matchmakingRoom);
  socket2.leave(matchmakingRoom);
  const match = new Match(`${gameRoomPrefix}-${uuidv4()}`, socket1, socket2);
  const gameParams: ClientGameParams = {
    preloadCardIds: [...new Set(match.players.flatMap(p => p.deck).map(c => c.id))]
  };
  io.sockets.to(match.room).emit(MsgTypeOutbound.Matchmaking, 'start', gameParams);
}
