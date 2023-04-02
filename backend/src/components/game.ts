import Match from './classes/match';
import Player from './classes/player';
import { Card } from './cards/card';

const initialCardsToDraw = 7;

function shuffle<T>(array: Array<T>): Array<T> {
    return array.sort(() => Math.random() -0.5)
}

function drawCards(deck: Array<Card>, num: number): Array<Card> {
    const drawnCards = deck.slice(0, num);
    deck.splice(0, num);
    return drawnCards;
}

function getPlayer(socket, playerNo: number): Player {
    return socket.data.match.players[playerNo].id;
}

function getSocket(io, socket, playerNo: number) {
    return io.sockets.sockets.get(getPlayer(socket, playerNo));
}

function initMatch(io, socket): void {
    socket.players.array.forEach(player => {
        player.deck = shuffle(player.deck);
        player.hand = drawCards(player.deck, initialCardsToDraw);
        // Emit draw cards event
        // Emit state
        // Initialize 1st turn
    });
}

export function gameSocketListeners(io, socket): void {
    socket.on('ready', () => {
        console.log('Player ' + socket.data.name + ' is ready');
        socket.data.match.players[socket.data.playerNo].ready = true;
        if (socket.data.match.players[socket.data.opponentPlayerNo()].ready)
            console.log('Game match ' + socket.data.match.matchName() + ' is ready to start');
            initMatch(io, socket);
    });
};
