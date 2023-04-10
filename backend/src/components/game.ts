import Match from './classes/match';
import Player from './classes/player';
import { Card } from './classes/cards/card';

const initialCardsToDraw = 7;
const mesgTypes = {
    state: 'state'
}

function shuffle<T>(array: Array<T>): Array<T> {
    return array.sort(() => Math.random() -0.5)
}

function drawCards(deck: Array<Card>, num: number): Array<Card> {
    return deck.splice(0, num);
}

function getPlayer(socket, playerNo: number): Player {
    return socket.data.match.players[playerNo].id;
}

function getSocket(io, socket, playerNo: number) {
    return io.sockets.sockets.get(getPlayer(socket, playerNo));
}

function forAllPlayers(f: (playerNo: number) => void): void {
    f(0);
    f(1);
}

function initMatch(io, socket): void {
    const match = socket.data.match;
    match.players.forEach((player: Player) => {
        player.deck = shuffle(player.deck);
        player.hand = drawCards(player.deck, initialCardsToDraw);
    });
    // Emit draw cards event
    forAllPlayers((playerNo: number) => {
        getSocket(io, socket, playerNo).emit(mesgTypes.state, match.getFrontendState(playerNo));
    });
    // Initialize 1st turn
}

export function gameSocketListeners(io, socket): void {
    socket.on('ready', () => {
        socket.data.match.players[socket.data.playerNo].ready = true;
        if (socket.data.match.players[socket.data.opponentPlayerNo()].ready) {
            console.log('Game match ' + socket.data.match.matchName() + ' is ready to start');
            initMatch(io, socket);
        }
    });
};
