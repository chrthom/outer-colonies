import Match from './game_state/match';
import toClientState from './converters/client_state_converter';
import { rules } from './config/rules';
import { MsgTypeInbound, MsgTypeOutbound, TurnPhase, Zone } from './config/enums';
import { getCardStackByUUID } from './utils/helpers';
import { Server, Socket } from 'socket.io';
import { ClientPlannedBattle } from './shared_interfaces/client_planned_battle';
import Player from './game_state/player';
import SocketData from './game_state/socket_data';

function getSocket(io: Server, match: Match, playerNo: number): Socket {
  return io.sockets.sockets.get(match.players[playerNo].socketId);
}

function getPlayer(socket: Socket): Player {
  return data(socket).match.players[data(socket).playerNo];
}

function emitState(io: Server, match: Match) {
  match.forAllPlayers((playerNo: number) => {
    const socket = getSocket(io, match, playerNo);
    if (socket) socket.emit(MsgTypeOutbound.State, toClientState(match, playerNo));
    else console.log('WARN: Could not find socket to emit state');
  });
  match.battle.resetRecentEvents();
}

function initMatch(io: Server, match: Match) {
  match.setStartPlayer();
  match.players.forEach(player => {
    player.shuffleDeck();
    player.drawCards(rules.initialCardsToDraw);
  });
  match.prepareStartPhase();
  emitState(io, match);
}

export function gameSocketListeners(io: Server, socket: Socket) {
  socket.on(MsgTypeInbound.Ready, (turnPhase: string, data?: any) => {
    const match = data(socket).match;
    if (match && turnPhase == match.turnPhase) {
      if (turnPhase == TurnPhase.Init) {
        match.players[data(socket).playerNo].ready = true;
        if (match.players[data(socket).opponentPlayerNo()].ready) initMatch(io, match);
      } else if (data(socket).playerNo == match.actionPendingByPlayerNo) {
        switch (turnPhase) {
          case TurnPhase.Build:
            if (data(socket).playerNo == match.activePlayerNo) {
              match.prepareBuildPhaseReaction(<ClientPlannedBattle>data);
            } else {
              match.prepareCombatPhase(<string[]>data);
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
  socket.on(MsgTypeInbound.Disconnect, () => {
    const match = data(socket).match;
    if (match) {
      if (!match.gameResult.gameOver) {
        const player = getPlayer(socket);
        console.log(`Player ${player.name} disconnected from active game`);
        match.gameResult.setWinnerBySurrender(player);
        emitState(io, match);
      }
    }
  });
  socket.on(MsgTypeInbound.Handcard, (handCardUUID: string, targetUUID: string) => {
    const match = data(socket).match;
    const player = getPlayer(socket);
    const handCard = getCardStackByUUID(player.hand, handCardUUID);
    const target = getCardStackByUUID(match.getInPlayCardStacks(), targetUUID);
    if (!handCard) {
      console.log(`WARN: ${player.name} tried to play non-existing card ${handCardUUID}`);
    } else if (!target) {
      console.log(
        `WARN: ${player.name} tried to play card ${handCard.card.name} on an non-existing target ${targetUUID}`
      );
    } else if (!handCard.isPlayable) {
      console.log(`WARN: ${player.name} tried to play non-playable card ${handCard.card.name}`);
    } else if (!handCard.canBeAttachedTo(target)) {
      console.log(
        `WARN: ${player.name} tried to play card ${handCard.card.name} on invalid target ${target.card.name}`
      );
    } else {
      player.playHandCard(handCard, target);
    }
    emitState(io, match);
  });
  socket.on(MsgTypeInbound.Retract, (cardStackUUID: string, cardIndex: number) => {
    const match = data(socket).match;
    const player = getPlayer(socket);
    const rootCardStack = getCardStackByUUID(player.cardStacks, cardStackUUID);
    const targetCardStack =
      rootCardStack && rootCardStack.cardStacks.length > cardIndex
        ? rootCardStack.cardStacks[cardIndex]
        : null;
    if (!rootCardStack) {
      console.log(`WARN: ${player.name} tried to retract from non-existing card stack ${cardStackUUID}`);
    } else if (!targetCardStack) {
      console.log(
        `WARN: ${player.name} tried to retract non-existing card with index ${cardIndex} from card stack ${cardStackUUID}`
      );
    } else if (!targetCardStack.canBeRetracted) {
      console.log(`WARN: ${player.name} tried to retract non-retractable card ${targetCardStack.card.name}`);
    } else {
      targetCardStack.retract();
    }
    emitState(io, match);
  });
  socket.on(MsgTypeInbound.Discard, (handCardUUID: string) => {
    const match = data(socket).match;
    const player = getPlayer(socket);
    const handCard = getCardStackByUUID(player.hand, handCardUUID);
    if (!handCard) {
      console.log(`WARN: ${player.name} tried to discard non-existing card ${handCardUUID}`);
    } else {
      player.discardHandCards(handCardUUID);
      match.prepareEndPhase();
    }
    emitState(io, match);
  });
  socket.on(MsgTypeInbound.Attack, (srcId: string, srcIndex: number, targetId: string) => {
    const match = data(socket).match;
    const player = getPlayer(socket);
    const playerShips = match.battle.ships[match.actionPendingByPlayerNo];
    const opponentShips = match.battle.ships[match.getWaitingPlayerNo()];
    const srcShip = playerShips.find(cs => cs.uuid == srcId);
    const srcWeapon = srcShip ? srcShip.cardStacks[srcIndex] : null;
    const target = opponentShips.find(cs => cs.uuid == targetId);
    if (!srcShip) {
      console.log(`WARN: ${player.name} tried to attack from non-existing ship ${srcId}`);
    } else if (!srcWeapon) {
      console.log(
        `WARN: ${player.name} tried to attack from invalid weapon index ${srcIndex} of ${srcShip.card.name}`
      );
    } else if (!target) {
      console.log(`WARN: ${player.name} tried to attack non-exisiting target ${targetId}`);
    } else if (!srcWeapon.attackAvailable) {
      console.log(
        `WARN: ${player.name} tried to attack from deactivated weapon index ${srcIndex} (${srcWeapon.card.name})`
      );
    } else {
      srcWeapon.attack(target);
    }
    emitState(io, match);
  });
}

function data(socket: Socket): SocketData {
  return <SocketData>socket.data;
}
