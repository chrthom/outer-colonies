import SocketData from './game_state/socket_data';
import Match from './game_state/match';
import Player from './game_state/player';
import { MsgTypeInbound, MsgTypeOutbound } from '../shared/config/enums';
import { v4 as uuidv4 } from 'uuid';
import { Server, Socket } from 'socket.io';
import ClientGameParams from '../shared/interfaces/client_game_params';
import DBCredentialsDAO from './persistence/db_credentials';

export const matchmakingRoom = 'matchmaking';
const gameRoomPrefix = 'match';

export function matchMakingSocketListeners(io: Server, socket: Socket): void {
  socket.on(MsgTypeInbound.Login, (sessionToken: string) => {
    if (sessionToken) {
      DBCredentialsDAO.getBySessionToken(sessionToken).then(user => {
        if (user) {
          console.log(`Player logged in: ${user.username}`);
          socket.data = new SocketData(user);
          socket.join(matchmakingRoom);
          socket.emit(MsgTypeOutbound.Matchmaking, 'search', clientsInMatchMaking(io).size - 1);
        } else {
          console.log(`WARN: Invalid session token ${sessionToken} provided`);
        }
      });
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

function joinGame(socket: Socket, match: Match, playerNo: number): void {
  socket.leave(matchmakingRoom);
  socket.join(match.room);
  const socketData: SocketData = <SocketData>socket.data;
  socketData.match = match;
  socketData.playerNo = playerNo;
  match.players[playerNo] = new Player(
    socket.id,
    socketData.user.username,
    match,
    playerNo,
    socketData.activeDeck.slice()
  );
}

function initGame(io: Server, socket1: Socket, socket2: Socket): void {
  const match = new Match(`${gameRoomPrefix}-${uuidv4()}`);
  joinGame(socket1, match, 0);
  joinGame(socket2, match, 1);
  const gameParams: ClientGameParams = {
    preloadCardIds: [...new Set(match.players.flatMap(p => p.deck).map(c => c.id))]
  };
  io.sockets.to(match.room).emit(MsgTypeOutbound.Matchmaking, 'start', gameParams);
}
