import Player from '../game_state/player';
import Match from '../game_state/match';
import toFrontendState from '../frontend_converters/frontend_state';
import { rules } from '../config/rules';
import { MesgType } from '../config/oc_enums'

function getSocket(io, match: Match, playerNo: number) {
    return io.sockets.sockets.get(match.players[playerNo].id);
}

function getPlayer(socket) {
    return socket.data.match.players[socket.data.playerNo];
}

function forAllPlayers(f: (playerNo: number) => void): void {
    f(0);
    f(1);
}

function emitState(io, match: Match): void {
    forAllPlayers((playerNo: number) => {
        getSocket(io, match, playerNo).emit(MesgType.state, toFrontendState(match, playerNo));
    });
}

function initMatch(io, match: Match): void {
    match.setStartPlayer();
    match.players.forEach((player: Player) => {
        player.shuffleDeck();
        player.drawCards(rules.initialCardsToDraw);
    });
    // TODO: Emit draw cards event
    emitState(io, match);
    // TODO: Wait for respone for redrawing cards
    nextTurn(io, match);
}

function nextTurn(io, match: Match): void {
    match.execStartPhase();
    // TODO: Emit start phase event
    emitState(io, match);
    // TODO: Wait for response to continue
    match.execBuildPhase();
    emitState(io, match);
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
    socket.on('handcard', (index) => {
        const match = socket.data.match;
        const player = getPlayer(socket);
        const handCard = player.hand[index];
        console.log(`Player ${getPlayer(socket).name} clicked card number ${index} => ${getPlayer(socket).hand[index].name}`); //

        // CONTINUE HERE: Check cards to attach this to + attach to colony - see card.js canBeAttachedTo() and canBeAttachedToColony()
        if (match.checkCardIsPlayable(handCard, player, match.getActivePlayer.id == player.id)) {
            const cardStacks =  player.cardStacks;
            const canBeAttachedToColony = handCard.canBeAttachedToColony(cardStacks);
            const canBeAttachedTo = handCard.canBeAttachedTo(cardStacks);
        } else this.emitState(io, match);
    });
};
