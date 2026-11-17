import SocketData from './game_state/socket_data';
import Match from './game_state/match';
import { MatchmakingStatus, MsgTypeInbound, MsgTypeOutbound } from '../shared/config/enums';
import { v4 as uuidv4 } from 'uuid';
import { Server, Socket } from 'socket.io';
import ClientGameParams from '../shared/interfaces/client_game_params';
import DBCredentialsDAO from './persistence/db_credentials';
import DBDecksDAO from './persistence/db_decks';
import CardCollection from './cards/collection/card_collection';
import Player from './game_state/player';
import { findRejoinableMatch, registerMatch } from './match_registry';

// Room name of the matchmaking lobby. Deliberately distinct from the
// MsgTypeOutbound.Matchmaking event name so that the room and the event cannot
// be mixed up (they share the socket.io namespace otherwise).
export const matchmakingRoom = 'matchmaking-lobby';
const gameRoomPrefix = 'match';

export function matchMakingSocketListeners(io: Server, socket: Socket): void {
  socket.on(MsgTypeInbound.Login, async (sessionToken: string) => {
    if (!sessionToken) return;
    try {
      const user = await DBCredentialsDAO.getBySessionToken(sessionToken);
      if (!user) {
        console.log('WARN: Invalid session token provided');
        return;
      }
      const deckCards = await DBDecksDAO.getByUserId(user.userId);
      const activeDeck = deckCards
        .filter(c => c.inUse)
        .map(c => CardCollection.cards[c.cardId as keyof typeof CardCollection.cards]);
      console.log(`Player logged in: ${user.username}`);
      socket.data = new SocketData(user, activeDeck);
      const rejoinableMatch = findRejoinableMatch(user.userId);
      if (rejoinableMatch) {
        rejoinMatch(io, socket, rejoinableMatch.match, rejoinableMatch.player);
      } else {
        socket.join(matchmakingRoom);
        socket.emit(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Search, clientsInMatchMaking(io).size - 1);
      }
    } catch (err) {
      console.log(`ERROR: Login failed: ${err}`);
    }
  });
}

export function matchMakingCron(io: Server) {
  const clients: Socket[] = Array.from(clientsInMatchMaking(io))
    .map(cid => io.sockets.sockets.get(cid))
    .filter((c): c is Socket => !!c);
  while (clients.length > 1) {
    const [client1, client2] = [clients.pop()!, clients.pop()!];
    initGame(io, client1, client2);
  }
}

function clientsInMatchMaking(io: Server): Set<string> {
  return io.sockets.adapter.rooms.get(matchmakingRoom) ?? new Set();
}

function initGame(io: Server, socket1: Socket, socket2: Socket): void {
  socket1.leave(matchmakingRoom);
  socket2.leave(matchmakingRoom);
  const match = new Match(`${gameRoomPrefix}-${uuidv4()}`, socket1, socket2);
  registerMatch(match);
  io.sockets.to(match.room).emit(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Start, gameParamsFor(match));
}

/**
 * Binds a socket of a player back to their match: to the running match within
 * the reconnection grace window, or to a finished match which still owes them
 * its result (the client pulls the current state with its initial ready event).
 */
function rejoinMatch(io: Server, socket: Socket, match: Match, player: Player): void {
  const socketData = <SocketData>socket.data;
  console.log(`Player ${player.name} rejoined match ${match.room}`);
  // Detach the socket of the previous connection: a lingering old socket must
  // neither act on the match under the player's identity nor re-mark the
  // rejoined player as disconnected via its late Disconnect event
  const previousSocket = io.sockets.sockets.get(player.socketId);
  if (previousSocket && previousSocket.id != socket.id) {
    const previousSocketData = <SocketData>previousSocket.data;
    previousSocketData.match = undefined;
    previousSocketData.playerNo = undefined;
    previousSocket.leave(match.room);
  }
  socketData.match = match;
  socketData.playerNo = player.no;
  socket.join(match.room);
  player.socketId = socket.id;
  player.disconnectedSince = undefined;
  socket.emit(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Start, gameParamsFor(match));
}

function gameParamsFor(match: Match): ClientGameParams {
  return {
    preloadCardIds: [...new Set(match.players.flatMap(p => p.deck).map(c => c.id))]
  };
}
