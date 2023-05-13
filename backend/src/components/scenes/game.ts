import Match from '../game_state/match';
import toFrontendState from '../frontend_converters/frontend_state';
import { rules } from '../config/rules';
import { MsgTypeInbound, MsgTypeOutbound, TurnPhase, Zone } from '../config/enums'
import { getCardStackByUUID } from '../utils/utils';
import { consts } from '../config/consts';
import { Server, Socket } from 'socket.io';
import { FrontendPlannedBattle } from '../frontend_converters/frontend_planned_battle';

function getSocket(io: Server, match: Match, playerNo: number) {
    return io.sockets.sockets.get(match.players[playerNo].id);
}

function getPlayer(socket: Socket) {
    return socket.data.match.players[socket.data.playerNo];
}

function forAllPlayers(f: (playerNo: number) => void): void {
    f(0);
    f(1);
}

function emitState(io: Server, match: Match): void {
    forAllPlayers((playerNo: number) => {
        getSocket(io, match, playerNo).emit(MsgTypeOutbound.State, toFrontendState(match, playerNo));
    });
}

function initMatch(io: Server, match: Match): void {
    match.setStartPlayer();
    match.players.forEach(player => {
        player.shuffleDeck();
        player.drawCards(rules.initialCardsToDraw);
    });
    // TODO: Emit draw cards event
    // TODO: Wait for respone for redrawing cards
    match.prepareStartPhase();
    emitState(io, match);
}

export function gameSocketListeners(io: Server, socket: Socket): void {
    socket.on(MsgTypeInbound.Ready, (turnPhase: string, data?: any) => {
        const match = socket.data.match;
        if (turnPhase == match.turnPhase) {
            if (turnPhase == TurnPhase.Init) {
                match.players[socket.data.playerNo].ready = true;
                if (match.players[socket.data.opponentPlayerNo()].ready) initMatch(io, match);
            } else if (socket.data.playerNo == match.actionPendingByPlayerNo) {
                if (socket.data.playerNo == match.activePlayerNo) {
                    switch(turnPhase) {
                        case TurnPhase.Init:
                            match.players[socket.data.playerNo].ready = true;
                            if (match.players[socket.data.opponentPlayerNo()].ready) initMatch(io, match);
                            break;
                        case TurnPhase.Build:
                            match.prepareBuildPhaseReaction(<FrontendPlannedBattle> data);
                            emitState(io, match);
                            break;
                    }
                } else {
                    switch(turnPhase) {
                        case TurnPhase.Build:
                            // TODO: Opponent reacting on planned mission
                            match.prepareCombatPhase(<Array<string>> data);
                            emitState(io, match);
                            break;
                    }
                }
            }
        }
    });
    socket.on(MsgTypeInbound.Handcard, (handCardUUID: string, targetUUID: string) => {
        const match = socket.data.match;
        const player = getPlayer(socket);
        const handCard = getCardStackByUUID(player.hand, handCardUUID);
        if (handCard.card.isPlayable(match, socket.data.playerNo)) {
            if (targetUUID == consts.colonyPlayer) { // TODO: Also accept opponent's colony for tactic cards
                if (handCard.card.canBeAttachedToColony(player.cardStacks)) {
                    player.playCardToColonyZone(handCard);
                } else {
                    console.log(`WARN: ${player.name} tried to play card ${handCard.card.name} on own colony, which is not a valid target`);
                }
            } else {
                const target = getCardStackByUUID(player.cardStacks, targetUUID); // TODO: Also check opponent card stack
                if (target) {
                    if (handCard.card.canBeAttachedTo([ target ]).length > 0) {
                        player.attachCardToCardStack(handCard, target);
                    } else {
                        console.log(`WARN: ${player.name} tried to play card ${handCard.card.name} on invalid target ${target.card.name}`);
                    }
                } else {
                    console.log(`WARN: ${player.name} tried to play card ${handCard.card.name} on an non-existing target ${targetUUID}`);
                }
            }
        } else {
            console.log(`WARN: ${player.name} tried to play non-playable card ${handCard.card.name}`);
        }
        emitState(io, match);
    });
};
