import Match from './game_state/match';
import toClientState from './converters/client_state_converter';
import { rules } from '../shared/config/rules';
import { MsgTypeInbound, MsgTypeOutbound, TurnPhase } from '../shared/config/enums';
import { getCardStackByUUID } from './utils/helpers';
import { Server, Socket } from 'socket.io';
import { ClientPlannedBattle } from '../shared/interfaces/client_planned_battle';
import Player from './game_state/player';
import SocketData from './game_state/socket_data';

function getSocket(io: Server, match: Match, playerNo: number): Socket {
  return io.sockets.sockets.get(match.players[playerNo].socketId);
}

function getPlayer(socket: Socket): Player {
  return socketData(socket).match.players[socketData(socket).playerNo];
}

function emitState(io: Server, match: Match) {
  match.forAllPlayers((playerNo: number) => {
    const socket = getSocket(io, match, playerNo);
    if (socket) socket.emit(MsgTypeOutbound.State, toClientState(match, playerNo));
    else console.log('WARN: Could not find socket to emit state');
  });
  match.resetTempStates();
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
    const match = socketData(socket).match;
    if (match && turnPhase == match.turnPhase) {
      if (turnPhase == TurnPhase.Init) {
        match.players[socketData(socket).playerNo].ready = true;
        if (match.players[socketData(socket).opponentPlayerNo()].ready) initMatch(io, match);
      } else if (
        (socketData(socket).playerNo == match.actionPendingByPlayerNo && match.intervention) ||
        turnPhase == TurnPhase.Build ||
        turnPhase == TurnPhase.Combat
      ) {
        if (match.intervention) {
          match.skipIntervention();
        } else {
          switch (turnPhase) {
            case TurnPhase.Build:
              if (socketData(socket).playerNo == match.activePlayerNo) {
                match.prepareBuildPhaseReaction(<ClientPlannedBattle>data);
              } else {
                match.prepareCombatPhase(<string[]>data);
              }
              break;
            case TurnPhase.Combat:
              match.processBattleRound();
              break;
          }
        }
      }
    }
    emitState(io, match);
  });
  socket.on(MsgTypeInbound.Disconnect, () => {
    const match = socketData(socket).match;
    if (match) {
      if (!match.gameResult.gameOver) {
        const player = getPlayer(socket);
        console.log(`Player ${player.name} disconnected from active game`);
        match.gameResult.setWinnerBySurrender(player);
      }
      emitState(io, match);
    }
  });
  socket.on(MsgTypeInbound.Handcard, (handCardUUID: string, targetUUID: string) => {
    const match = socketData(socket).match;
    const player = getPlayer(socket);
    const handCard = getCardStackByUUID(player.hand, handCardUUID);
    const target = getCardStackByUUID(match.getInPlayCardStacks(), targetUUID);
    if (!handCard) {
      console.log(`WARN: ${player.name} tried to play non-existing card ${handCardUUID}`);
    } else if (!target) {
      console.log(
        `WARN: ${player.name} tried to play card ${handCard.card.name} on an non-existing target ${targetUUID}`
      );
    } else if (!handCard.hasValidTargets) {
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
    const match = socketData(socket).match;
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
    const match = socketData(socket).match;
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
    const match = socketData(socket).match;
    const player = getPlayer(socket);
    const playerShips = match.battle.ships[match.actionPendingByPlayerNo];
    const srcShip = playerShips.find(cs => cs.uuid == srcId);
    const srcWeapon = srcShip ? srcShip.cardStacks[srcIndex] : null;
    const opponentShips = match.battle.ships[match.getWaitingPlayerNo()];
    const target = opponentShips.find(cs => cs.uuid == targetId);
    if (!srcWeapon) {
      console.log(`WARN: ${player.name} tried to attack from invalid weapon`);
    } else if (!target) {
      console.log(`WARN: ${player.name} tried to attack non-exisiting target ${targetId}`);
    } else if (!srcWeapon.canAttack) {
      console.log(
        `WARN: ${player.name} tried to attack with a card ${srcWeapon.card.name} which cannot attack`
      );
    } else {
      match.planAttack(srcWeapon, target);
    }
    emitState(io, match);
  });
}

function socketData(socket: Socket): SocketData {
  return <SocketData>socket.data;
}
