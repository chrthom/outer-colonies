const Player = require('./classes/player');
const { v4: uuidv4 } = require('uuid');

const mm = 'matchmaking';
const gameRoomPrefix = 'game-';

function clientsInMatchMaking(io) {
    return io.sockets.adapter.rooms.get(mm);
}

function numberOfPlayersInMatchMaking(io) {
    const clients = clientsInMatchMaking(io);
    return clients ? clients.size : 0;
}

const matchMakingSocketListeners = (io, socket) => {
    socket.on('login', (name) => {
        console.log('Player logged in: ' + name);
        socket.player = new Player(name);
        socket.join(mm);
        socket.emit(mm, 'search', numberOfPlayersInMatchMaking(io) - 1);
    });
}

const matchMakingCron = (io) => {
    const clients = clientsInMatchMaking(io);
    if (clients) {
        const numClients = numberOfPlayersInMatchMaking(io);
        console.log('Performing matchmaking for ' + numClients + ' clients...');
        let partnerSocket = null;
        for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            clientSocket.emit(mm, 'search', numClients - 1);
            if (partnerSocket) {
                let gameRoom = gameRoomPrefix + uuidv4();
                clientSocket.leave(mm);
                clientSocket.join(gameRoom);
                partnerSocket.leave(mm);
                partnerSocket.join(gameRoom);
                io.sockets.in(gameRoom).emit(mm, 'start', clientSocket.player.name + ' vs. ' + partnerSocket.player.name);
            } else {
                partnerSocket = clientSocket;
            }
        }
    }
}

module.exports = {
    matchMakingSocketListeners,
    matchMakingCron
};
