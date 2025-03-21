import Match from './game_state/match';
import toClientState from './converters/client_state_converter';
import { rules } from '../shared/config/rules';
import { MsgTypeInbound, MsgTypeOutbound, TurnPhase } from '../shared/config/enums';
import { getCardStackByUUID, opponentPlayerNo } from './utils/helpers';
import { Server, Socket } from 'socket.io';
import ClientPlannedBattle from '../shared/interfaces/client_planned_battle';
import Player from './game_state/player';
import SocketData from './game_state/socket_data';
import { matchmakingRoom } from './matchmaking';

export function gameSocketListeners(io: Server, socket: Socket) {
  socket.on(MsgTypeInbound.Ready, (turnPhase: string, data?: any) => {
    doWithMatchAndPlayer(socket, (match, player) => {
      if (turnPhase == match.turnPhase) {
        if (turnPhase == TurnPhase.Init) {
          match.players[player.no].ready = true;
          if (match.players[opponentPlayerNo(player.no)].ready) initMatch(io, match);
        } else if (getSocketData(socket).playerNo == match.pendingActionPlayerNo) {
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
  });
  socket.on(MsgTypeInbound.Disconnect, () => {
    doWithMatchAndPlayer(socket, (match, player) => {
      if (!match.gameResult.gameOver) {
        console.log(`Player ${player.name} disconnected from active game`);
        match.gameResult.setWinnerBySurrender(player);
      }
      emitState(io, match);
    });
  });
  socket.on(MsgTypeInbound.Handcard, (handCardUUID: string, targetUUID: string) => {
    doWithMatchAndPlayer(socket, (match, player) => {
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
  });
  socket.on(MsgTypeInbound.Retract, (rootCardStackUUID: string, subCardStackUUID: string) => {
    doWithMatchAndPlayer(socket, (match, player) => {
      const rootCardStack = getCardStackByUUID(player.cardStacks, rootCardStackUUID);
      const subCardStack = rootCardStack && getCardStackByUUID(rootCardStack.cardStacks, subCardStackUUID);
      if (!rootCardStack) {
        console.log(
          `WARN: ${player.name} tried to retract from non-existing card stack ${rootCardStackUUID}`
        );
      } else if (!subCardStack) {
        console.log(
          `WARN: ${player.name} tried to retract non-existing card ${subCardStackUUID} from card stack ${rootCardStackUUID}`
        );
      } else if (!subCardStack.canBeRetracted) {
        console.log(`WARN: ${player.name} tried to retract non-retractable card ${subCardStack.card.name}`);
      } else {
        subCardStack.retract();
      }
      emitState(io, match);
    });
  });
  socket.on(MsgTypeInbound.Discard, (handCardUUID: string) => {
    doWithMatchAndPlayer(socket, (match, player) => {
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
  });
  socket.on(MsgTypeInbound.Attack, (shipUUID: string, weaponUUID: string, targetId: string) => {
    const match = getSocketData(socket).match;
    const player = getPlayer(socket);
    if (match && player) {
      const playerShips = match.battle.ships[match.pendingActionPlayerNo];
      const srcShip = playerShips.find(cs => cs.uuid == shipUUID);
      const srcWeapon = getCardStackByUUID(srcShip?.cardStacks ?? [], weaponUUID);
      const opponentShips = match.battle.ships[match.waitingPlayerNo];
      const target = opponentShips.find(cs => cs.uuid == targetId);
      if (!srcWeapon) {
        console.log(`WARN: ${player.name} tried to attack from invalid weapon UUID`);
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
    }
  });
}

export function gameCron(io: Server) {
  Array.from(io.sockets.adapter.rooms)
    .filter(room => !room[1].has(room[0]) && room[0] != matchmakingRoom)
    .map(r => {
      const [clientId] = r[1];
      return io.sockets.sockets.get(clientId);
    })
    .filter((socket): socket is Socket => !!socket)
    .map(socket => getSocketData(socket).match)
    .filter((match): match is Match => !!match)
    .filter(match => match.players[0].ready && match.players[1].ready && !match.gameResult.gameOver)
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

function doWithMatchAndPlayer(socket: Socket, f: (m: Match, p: Player) => void) {
  const match = getSocketData(socket).match;
  const player = getPlayer(socket);
  if (match && player) f(match, player);
  else console.log(`WARN: Match or player in socket ${socket.id} not initialized`);
}

function getSocketData(socket: Socket): SocketData {
  return <SocketData>socket.data;
}

function getSocket(io: Server, match: Match, playerNo: number): Socket | undefined {
  return io.sockets.sockets.get(match.players[playerNo].socketId);
}

function getPlayer(socket: Socket): Player | undefined {
  const playerNo = getSocketData(socket).playerNo;
  return playerNo == 0 || playerNo == 1 ? getSocketData(socket).match?.players[playerNo] : undefined;
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
