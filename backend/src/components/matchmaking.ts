import SocketData from './classes/socket_data';
import { v4 as uuidv4 } from 'uuid';
import Match from './classes/match';
import Player from './classes/player';

const mm = 'matchmaking';
const gameRoomPrefix = 'match-';

function clientsInMatchMaking(io) {
    return io.sockets.adapter.rooms.get(mm);
}

function numberOfPlayersInMatchMaking(io): number {
    const clients = clientsInMatchMaking(io);
    return clients ? clients.size : 0;
}

function joinGame(socket, match: Match, playerNo: number): void {
    socket.leave(mm);
    socket.join(match.room);
    socket.data.match = match;
    socket.data.playerNo = playerNo;
    match.players[playerNo] = new Player(socket.id, socket.data.name, socket.data.activeDeck.slice());
}

function initGame(io, socket1, socket2): void {
    const match = new Match(gameRoomPrefix + uuidv4());
    joinGame(socket1, match, 0);
    joinGame(socket2, match, 1);
    io.sockets.to(match.room).emit(mm, 'start', match.matchName());
}

export function matchMakingSocketListeners(io, socket): void {
    socket.on('login', (name: string) => {
        if (name) {
            console.log('Player logged in: ' + name);
            socket.data = new SocketData(name);
            socket.join(mm);
            socket.emit(mm, 'search', numberOfPlayersInMatchMaking(io) - 1);
        }
    });
}

export function matchMakingCron(io): void {
    const clients = clientsInMatchMaking(io);
    const numClients = numberOfPlayersInMatchMaking(io);
    if (numClients > 1) {
        console.log('Performing matchmaking for ' + numClients + ' clients...');
        let partnerSocket = null;
        for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            clientSocket.emit(mm, 'search', numClients - 1);
            if (partnerSocket) initGame(io, clientSocket, partnerSocket)
            else partnerSocket = clientSocket;
        }
    }
}
