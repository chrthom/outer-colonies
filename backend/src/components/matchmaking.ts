import SocketData from './classes/socket_data';
import { v4 as uuidv4 } from 'uuid';

const mm = 'matchmaking';
const gameRoomPrefix = 'game-';

function clientsInMatchMaking(io) {
    return io.sockets.adapter.rooms.get(mm);
}

function numberOfPlayersInMatchMaking(io): number {
    const clients = clientsInMatchMaking(io);
    return clients ? clients.size : 0;
}

function shuffle<T>(array: Array<T>): Array<T> {
    return array.sort(() => Math.random() -0.5)
}

function joinGame(socket, gameRoom): void {
    socket.leave(mm);
    socket.join(gameRoom);
    socket.data.game.room = gameRoom;
    socket.data.game.deck = shuffle(socket.data.activeDeck);
}

function initGame(io, socket1, socket2): void {
    let gameRoom = gameRoomPrefix + uuidv4();
    joinGame(socket1, gameRoom);
    joinGame(socket2, gameRoom);
    io.sockets.to(gameRoom).emit(mm, 'start', socket1.data.name + ' vs. ' + socket2.data.name);
}

export function matchMakingSocketListeners(io, socket): void {
    socket.on('login', (name) => {
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
