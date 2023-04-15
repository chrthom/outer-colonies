import Player from '../game_state/player';
import Match from '../game_state/match';
import toFrontendState from '../frontend_converters/frontend_state';
import toFrontendCardRequest from '../frontend_converters/frontend_card_request';
import { rules } from '../config/rules';
import { MsgTypeInbound, MsgTypeOutbound } from '../config/oc_enums'

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
        getSocket(io, match, playerNo).emit(MsgTypeOutbound.State, toFrontendState(match, playerNo));
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
    socket.on(MsgTypeInbound.Ready, () => {
        const match = socket.data.match;
        match.players[socket.data.playerNo].ready = true;
        if (match.players[socket.data.opponentPlayerNo()].ready) {
            console.log(`Game match ${match.matchName()} is ready to start`);
            initMatch(io, match);
        }
    });
    socket.on(MsgTypeInbound.Handcard, (index: number) => {
        const match = socket.data.match;
        const player = getPlayer(socket);
        const playerNo = socket.data.playerNo;
        const cardStacks = player.cardStacks;
        const handCard = player.hand[index];
        console.log(`Player ${getPlayer(socket).name} clicked card number ${index} => ${getPlayer(socket).hand[index].name}`); //
        if (handCard.isPlayable(match, playerNo)) {
            const payload = toFrontendCardRequest(handCard.canBeAttachedTo(cardStacks), handCard.canBeAttachedToColony(cardStacks), index);
            socket.emit(MsgTypeOutbound.CardRequest, payload);
        } else this.emitState(io, match);
    });
};
