import Match from '../game_state/match';
import toFrontendState from '../frontend_converters/frontend_state';
import { rules } from '../config/rules';
import { CardType, MsgTypeInbound, MsgTypeOutbound, TurnPhase, Zone } from '../config/enums'
import { getCardStackByUUID } from '../utils/utils';
import { Server, Socket } from 'socket.io';
import { FrontendPlannedBattle } from '../frontend_converters/frontend_planned_battle';
import EquipmentCard from '../cards/types/equipment_card';
import CardStack from '../cards/card_stack';

function getSocket(io: Server, match: Match, playerNo: number) {
    return io.sockets.sockets.get(match.players[playerNo].id);
}

function getPlayer(socket: Socket) {
    return socket.data.match.players[socket.data.playerNo];
}

function emitState(io: Server, match: Match): void {
    match.forAllPlayers((playerNo: number) => {
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
                switch (turnPhase) {
                    case TurnPhase.Build:
                        if (socket.data.playerNo == match.activePlayerNo) {
                            match.prepareBuildPhaseReaction(<FrontendPlannedBattle> data);
                        } else {
                            match.prepareCombatPhase(<Array<string>> data);
                        }
                        break;
                    case TurnPhase.Combat:
                        match.processBattleRound();
                        break;
                }
                emitState(io, match);
            }
        }
    });
    socket.on(MsgTypeInbound.Handcard, (handCardUUID: string, targetUUID: string) => {
        const match = socket.data.match;
        const player = getPlayer(socket);
        const handCard = getCardStackByUUID(player.hand, handCardUUID);
        const target = getCardStackByUUID(player.cardStacks, targetUUID); // TODO: Also check opponent card stack (+colony) for tactic cards
        if (!handCard) {
            console.log(`WARN: ${player.name} tried to play non-existing card ${handCardUUID}`);
        } else if (!target) {
            console.log(`WARN: ${player.name} tried to play card ${handCard.card.name} on an non-existing target ${targetUUID}`);
        } else if (!handCard.isPlayable()) {
            console.log(`WARN: ${player.name} tried to play non-playable card ${handCard.card.name}`);
        } else if (!handCard.canBeAttachedTo(target)) {
            console.log(`WARN: ${player.name} tried to play card ${handCard.card.name} on invalid target ${target.card.name}`);
        } else { // TODO: Refactor whole else block into single method under player class
            handCard.performImmediateEffect();
            if (handCard.card.staysInPlay) {
                if (target.type() == CardType.Colony) { // TODO: Unify this and attaching to other cards into one method
                    player.playCardToColonyZone(handCard);
                } else {
                    player.attachCardToCardStack(handCard, target);
                }
            } else {
                player.discardHandCard(handCardUUID);
            }
        }
        emitState(io, match);
    });
    socket.on(MsgTypeInbound.Attack, (srcId: string, srcIndex: number, targetId: string) => {
        const match = socket.data.match;
        const player = getPlayer(socket);
        const playerShips: Array<CardStack> = match.battle.ships[match.actionPendingByPlayerNo];
        const opponentShips: Array<CardStack> = match.battle.ships[match.getWaitingPlayerNo()];
        const srcShip = playerShips.find(cs => cs.uuid == srcId);
        const srcWeapon = srcShip ? srcShip.getCardStacks()[srcIndex] : null;
        const target = opponentShips.find(cs => cs.uuid == targetId)
        if (!srcShip) {
            console.log(`WARN: ${player.name} tried to attack from non-existing ship ${srcId}`);
        } else if (!srcWeapon) {
            console.log(`WARN: ${player.name} tried to attack from invalid weapon index ${srcIndex} of ${srcShip.card.name}`);
        } else if (!target) {
            console.log(`WARN: ${player.name} tried to attack non-exisiting target ${targetId}`);
        } else if (!srcWeapon.attackAvailable) {
            console.log(`WARN: ${player.name} tried to attack from deactivated weapon index ${srcIndex} (${srcWeapon.card.name})`);
        } else {
            const srcWeaponCard = <EquipmentCard> srcWeapon.card;
            if (srcWeaponCard.attackProfile.range < match.battle.range) {
                console.log(`WARN: ${player.name} tried to attack with range ${srcWeaponCard.attackProfile.range} weapon at range ${match.battle.range}`);
            } else {
                srcWeaponCard.attack(match, srcShip, target);
                // TODO: Handle attacks on colony
                srcWeapon.attackAvailable = false;
            }
        }
        // TODO: Check if further weapons can be used, else end round
        emitState(io, match);
    });
};
