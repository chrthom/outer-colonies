import SocketData from './classes/socket_data';
import Match from './classes/match';
import Player from './classes/player';

function shuffle<T>(array: Array<T>): Array<T> {
    return array.sort(() => Math.random() -0.5)
}

export function gameSocketListeners(io, socket): void {
    socket.on('ready', () => {
        console.log('Player ' + socket.data.name + ' is ready');
        socket.data.match.players[socket.data.playerNo].ready = true;
        if (socket.data.match.players[0].ready && socket.data.match.players[1].ready)
            console.log('Game match ' + socket.data.match.matchName() + ' is ready to start')
    });
};
