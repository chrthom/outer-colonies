import SocketData from './classes/socket_data';

export function gameSocketListeners(io, socket): void {
    socket.on('ready', () => {
        console.log('Player ' + socket.data.name + ' is ready');
    });
};
