import Player from '../game_state/player';
import Match from '../game_state/match';
import toFrontendState from '../frontend_converters/frontend_state';
import toFrontendCardRequest from '../frontend_converters/frontend_card_request';
import { rules } from '../config/rules';
import { MsgTypeInbound, MsgTypeOutbound } from '../config/oc_enums'
import { getCardStackByUUID } from '../utils/oc_utils';

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
    socket.on(MsgTypeInbound.Handcard, (handCardUUID: string, targetUUID: string) => {
        const match = socket.data.match;
        const player = getPlayer(socket);
        const handCard = getCardStackByUUID(player.hand, handCardUUID);
        if (handCard.card.isPlayable(match, socket.data.playerNo)) {
            if (targetUUID == 'colony') { // TODO: Also accept opponent's colony
                if (handCard.card.canBeAttachedToColony(player.cardStacks)) {
                    console.log(`Successfully played card ${handCard.card.name} on own colony`);
                    // TODO: Implement logic to play card
                } else {
                    console.log(`WARN: ${player.name} tried to play card ${handCard.card.name} on own colony, which is not a valid target`);
                    this.emitState(io, match);
                }
            } else {
                const target = getCardStackByUUID(player.card_stack, targetUUID); // TODO: Also check opponent card stack
                if (target) {
                    if (handCard.card.canBeAttachedTo([ target ])) {
                        console.log(`Successfully played card ${handCard.card.name} on target ${target.card.name}`);
                        // TODO: Implement logic to play card
                    } else {
                        console.log(`WARN: ${player.name} tried to play card ${handCard.card.name} on invalid target ${target.card.name}`);
                        this.emitState(io, match);
                    }
                } else {
                    console.log(`WARN: ${player.name} tried to play card ${handCard.card.name} on an no-existing target ${targetUUID}`);
                    this.emitState(io, match);
                }
            }
        } else {
            console.log(`WARN: ${player.name} tried to play non-playable card ${handCard.card.name}`);
            this.emitState(io, match);
        }
    });
};
