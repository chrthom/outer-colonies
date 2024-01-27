import Match from './game_state/match';
import toClientState from './converters/client_state_converter';
import { rules } from '../shared/config/rules';
import { MsgTypeInbound, MsgTypeOutbound, TurnPhase } from '../shared/config/enums';
import { getCardStackByUUID, opponentPlayerNo } from './utils/helpers';
import { Server, Socket } from 'socket.io';
import { ClientPlannedBattle } from '../shared/interfaces/client_planned_battle';
import Player from './game_state/player';
import SocketData from './game_state/socket_data';
import { matchmakingRoom } from './matchmaking';

export function gameSocketListeners(io: Server, socket: Socket) {
  socket.on(MsgTypeInbound.Ready, (turnPhase: string, data?: any) => {
    const match = getSocketData(socket).match;
    if (match && turnPhase == match.turnPhase) {
      if (turnPhase == TurnPhase.Init) {
        match.players[getSocketData(socket).playerNo].ready = true;
        if (match.players[getSocketData(socket).opponentPlayerNo()].ready) initMatch(io, match);
      } else if (
        (getSocketData(socket).playerNo == match.pendingActionPlayerNo && match.intervention) ||
        turnPhase == TurnPhase.Build ||
        turnPhase == TurnPhase.Combat
      ) {
        if (match.intervention) {
          match.skipIntervention();
        } else {
          switch (turnPhase) {
            case TurnPhase.Build:
              if (getSocketData(socket).playerNo == match.activePlayerNo) {
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
    const match = getSocketData(socket).match;
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
    const match = getSocketData(socket).match;
    const player = getPlayer(socket);
    const handCard = getCardStackByUUID(player.hand, handCardUUID);
    const target = getCardStackByUUID(match.allCardStacks, targetUUID);
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
    const match = getSocketData(socket).match;
    const player = getPlayer(socket);
    const rootCardStack = getCardStackByUUID(player.cardStacks, cardStackUUID);
    const targetCardStack =
      rootCardStack?.cardStacks.length > cardIndex ? rootCardStack.cardStacks[cardIndex] : undefined;
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
    const match = getSocketData(socket).match;
    const player = getPlayer(socket);
    const handCard = getCardStackByUUID(player.hand, handCardUUID);
    if (!handCard) {
      console.log(`WARN: ${player.name} tried to discard non-existing card ${handCardUUID}`);
    } else if (player.handCardLimit >= player.hand.length) {
      console.log(`WARN: ${player.name} tried to discard card dispite not over hand card limit`);
    } else {
      player.discardHandCards(handCardUUID);
      match.prepareEndPhase();
    }
    emitState(io, match);
  });
  socket.on(MsgTypeInbound.Attack, (srcId: string, srcIndex: number, targetId: string) => {
    const match = getSocketData(socket).match;
    const player = getPlayer(socket);
    const playerShips = match.battle.ships[match.pendingActionPlayerNo];
    const srcShip = playerShips.find(cs => cs.uuid == srcId);
    const srcWeapon = srcShip?.cardStacks[srcIndex];
    const opponentShips = match.battle.ships[match.waitingPlayerNo];
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

export function gameCron(io: Server) {
  Array.from(io.sockets.adapter.rooms)
    .filter(room => !room[1].has(room[0]) && room[0] != matchmakingRoom)
    .map(r => {
      const [clientId] = r[1];
      return getSocketData(io.sockets.sockets.get(clientId))?.match;
    })
    .filter(match => match?.players[0].ready && match?.players[1].ready)
    .filter(match => !match.gameResult.gameOver)
    .forEach(match => {
      if (--match.pendingActionPlayer.countdown <= 0) {
        match.gameResult.setWinnerByCountdown(match.pendingActionPlayer);
        emitState(io, match);
      }
      match.forAllPlayers((playerNo: number) => {
        const socket = getSocket(io, match, playerNo);
        if (socket)
          socket.emit(MsgTypeOutbound.Countdown, [
            match.players[playerNo].countdown,
            match.players[opponentPlayerNo(playerNo)].countdown
          ]);
        else console.log('WARN: Could not find socket to emit countdown');
      });
    });
}

function getSocketData(socket: Socket): SocketData {
  return <SocketData>socket.data;
}

function getSocket(io: Server, match: Match, playerNo: number): Socket {
  return io.sockets.sockets.get(match.players[playerNo].socketId);
}

function getPlayer(socket: Socket): Player {
  return getSocketData(socket).match.players[getSocketData(socket).playerNo];
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
