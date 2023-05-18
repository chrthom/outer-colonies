import SocketData from '../game_state/socket_data';
import Match from '../game_state/match';
import Player from '../game_state/player';
import { MsgTypeInbound, MsgTypeOutbound } from '../config/enums';
import { v4 as uuidv4 } from 'uuid';
import { Server, Socket } from 'socket.io';

const matchmakingRoom = 'matchmaking';
const gameRoomPrefix = 'match';

function clientsInMatchMaking(io: Server) {
    return io.sockets.adapter.rooms.get(matchmakingRoom);
}

function numberOfPlayersInMatchMaking(io: Server): number {
    const clients = clientsInMatchMaking(io);
    return clients ? clients.size : 0;
}

function joinGame(socket: Socket, match: Match, playerNo: number): void {
    socket.leave(matchmakingRoom);
    socket.join(match.room);
    socket.data.match = match;
    socket.data.playerNo = playerNo;
    match.players[playerNo] = new Player(socket.id, socket.data.name, playerNo, socket.data.activeDeck.slice());
}

function initGame(io: Server, socket1: Socket, socket2: Socket): void {
    const match = new Match(`${gameRoomPrefix}-${uuidv4()}`);
    joinGame(socket1, match, 0);
    joinGame(socket2, match, 1);
    io.sockets.to(match.room).emit(MsgTypeOutbound.Matchmaking, 'start', match.matchName());
}

export function matchMakingSocketListeners(io: Server, socket: Socket): void {
    socket.on(MsgTypeInbound.Login, (name: string) => {
        if (name) {
            console.log(`Player logged in: ${name}`);
            socket.data = new SocketData(name);
            socket.join(matchmakingRoom);
            socket.emit(MsgTypeOutbound.Matchmaking, 'search', numberOfPlayersInMatchMaking(io) - 1);
        }
    });
}

export function matchMakingCron(io: Server): void {
    const clients = clientsInMatchMaking(io);
    const numClients = numberOfPlayersInMatchMaking(io);
    if (numClients > 1) {
        console.log(`Performing matchmaking for ${numClients} clients...`);
        let partnerSocket = null;
        for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            clientSocket.emit(matchmakingRoom, 'search', numClients - 1);
            if (partnerSocket) initGame(io, clientSocket, partnerSocket)
            else partnerSocket = clientSocket;
        }
    }
}
