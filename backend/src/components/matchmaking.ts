import Player from './classes/player';
import { v4 as uuidv4 } from 'uuid';

const mm = 'matchmaking';
const gameRoomPrefix = 'game-';

function clientsInMatchMaking(io) {
    return io.sockets.adapter.rooms.get(mm);
}

function numberOfPlayersInMatchMaking(io) {
    const clients = clientsInMatchMaking(io);
    return clients ? clients.size : 0;
}

function initGame(io, socket1, socket2) {
    let gameRoom = gameRoomPrefix + uuidv4();
    socket1.leave(mm);
    socket1.join(gameRoom);
    socket1.player.game.deck = socket1.player.activeDeck;
    socket2.leave(mm);
    socket2.join(gameRoom);
    socket2.player.game.deck = socket2.player.activeDeck;
    io.sockets.in(gameRoom).emit(mm, 'start', socket1.player.name + ' vs. ' + socket2.player.name);
}

export const matchMakingSocketListeners = (io, socket) => {
    socket.on('login', (name) => {
        if (name) {
            console.log('Player logged in: ' + name);
            socket.player = new Player(name);
            socket.join(mm);
            socket.emit(mm, 'search', numberOfPlayersInMatchMaking(io) - 1);
        }
    });
}

export const matchMakingCron = (io) => {
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
