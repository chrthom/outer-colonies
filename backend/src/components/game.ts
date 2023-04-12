import Player from './classes/player';
import Match from './classes/match';
import { rules } from './rules';

enum MesgType {
    state = 'state'
}

function getSocket(io, match: Match, playerNo: number) {
    return io.sockets.sockets.get(match.players[playerNo].id);
}

function forAllPlayers(f: (playerNo: number) => void): void {
    f(0);
    f(1);
}

function emitState(io, match: Match): void {
    forAllPlayers((playerNo: number) => {
        getSocket(io, match, playerNo).emit(MesgType.state, match.getFrontendState(playerNo));
    });
}

function initMatch(io, match: Match): void {
    match.setStartPlayer();
    match.players.forEach((player: Player) => {
        player.shuffleDeck();
        player.drawCards(rules.initialCardsToDraw);
    });
    // Emit draw cards event
    emitState(io, match);
    match.nextTurn();
    // Emit start phase event
    emitState(io, match);
    match.execBuildPhase();
}

export function gameSocketListeners(io, socket): void {
    socket.on('ready', () => {
        const match = socket.data.match;
        match.players[socket.data.playerNo].ready = true;
        if (match.players[socket.data.opponentPlayerNo()].ready) {
            console.log(`Game match ${match.matchName()} is ready to start`);
            initMatch(io, match);
        }
    });
};
