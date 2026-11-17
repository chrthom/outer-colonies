import Match from './game_state/match';
import toClientState from './converters/client_state_converter';
import { rules } from '../shared/config/rules';
import { constants } from '../shared/config/constants';
import { MsgTypeInbound, MsgTypeOutbound, TurnPhase } from '../shared/config/enums';
import { getCardStackByUUID, opponentPlayerNo } from './utils/helpers';
import { logger } from './utils/logger';
import { Server, Socket } from 'socket.io';
import ClientPlannedBattle from '../shared/interfaces/client_planned_battle';
import Player from './game_state/player';
import SocketData from './game_state/socket_data';
import { matchmakingRoom } from './matchmaking';

export function gameSocketListeners(io: Server, socket: Socket) {
  socket.on(MsgTypeInbound.Ready, (turnPhase: string, data?: unknown) =>
    doWithMatchAndPlayer(socket, (match, player) => onReady(io, match, player, turnPhase, data))
  );
  socket.on(MsgTypeInbound.Disconnect, () =>
    doWithMatchAndPlayer(socket, (match, player) => onDisconnect(io, match, player))
  );
  socket.on(
    MsgTypeInbound.Handcard,
    (handCardUUID: string, targetUUID: string, optionalParameters?: number[]) =>
      doWithMatchAndPlayer(socket, (match, player) =>
        onHandCard(io, match, player, handCardUUID, targetUUID, optionalParameters)
      )
  );
  socket.on(MsgTypeInbound.Retract, (rootCardStackUUID: string, subCardStackUUID: string) =>
    doWithMatchAndPlayer(socket, (match, player) =>
      onRetract(io, match, player, rootCardStackUUID, subCardStackUUID)
    )
  );
  socket.on(MsgTypeInbound.Discard, (handCardUUID: string) =>
    doWithMatchAndPlayer(socket, (match, player) => onDiscard(io, match, player, handCardUUID))
  );
  socket.on(MsgTypeInbound.Attack, (shipUUID: string, weaponUUID: string, targetId: string) =>
    doWithMatchAndPlayer(socket, (match, player) =>
      onAttack(io, match, player, shipUUID, weaponUUID, targetId)
    )
  );
  socket.on(MsgTypeInbound.Surrender, () =>
    doWithMatchAndPlayer(socket, (match, player) => onSurrender(io, match, player))
  );
}

/**
 * Handles the ready event: acknowledges the current turn phase and either starts the match
 * (Init), resolves an open intervention or advances the phase (Build/Combat).
 * @param io server instance used to emit the new state to both players
 * @param match match the readying player belongs to
 * @param player readying player
 * @param turnPhase turn phase the player readied for
 * @param data phase-specific payload: planned battle (Build, active player) or intercepting ship ids
 */
function onReady(io: Server, match: Match, player: Player, turnPhase: string, data?: unknown) {
  if (turnPhase == match.turnPhase) {
    if (turnPhase == TurnPhase.Init) {
      match.players[player.no].ready = true;
      if (match.players[opponentPlayerNo(player.no)].ready) initMatch(io, match);
    } else if (player.no == match.pendingActionPlayerNo) {
      if (verifyReadyConditions(player, turnPhase)) {
        if (match.intervention) {
          match.skipIntervention();
        } else {
          switch (turnPhase) {
            case TurnPhase.Build:
              if (player.no == match.activePlayerNo) {
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
      } else {
        logger.warn(`${player.name} tried to ready but conditions not met`);
      }
    }
  }
  emitState(io, match);
}

/**
 * Handles a disconnect: an active game is decided by surrender of the disconnecting player.
 * @param io server instance used to emit the new state to both players
 * @param match match the disconnected player belongs to
 * @param player disconnected player
 */
function onDisconnect(io: Server, match: Match, player: Player) {
  if (!match.gameResult.gameOver) {
    logger.info(`Player ${player.name} disconnected from active game`);
    match.gameResult.setWinnerBySurrender(player);
  }
  emitState(io, match);
}

/**
 * Handles playing a hand card onto a target card stack.
 * @param io server instance used to emit the new state to both players
 * @param match match the acting player belongs to
 * @param player acting player
 * @param handCardUUID uuid of the played hand card
 * @param targetUUID uuid of the target card stack
 * @param optionalParameters optional card parameters (e.g. picked card options)
 */
function onHandCard(
  io: Server,
  match: Match,
  player: Player,
  handCardUUID: string,
  targetUUID: string,
  optionalParameters?: number[]
) {
  const handCard = getCardStackByUUID(player.hand, handCardUUID);
  const target = getCardStackByUUID(match.allCardStacks, targetUUID);
  if (!handCard) {
    logger.warn(`${player.name} tried to play non-existing card ${handCardUUID}`);
  } else if (!target) {
    logger.warn(
      `${player.name} tried to play card ${handCard.card.name} on a non-existing target ${targetUUID}`
    );
  } else if (!handCard.hasValidTargets) {
    logger.warn(`${player.name} tried to play non-playable card ${handCard.card.name}`);
  } else if (!handCard.canBeAttachedTo(target)) {
    logger.warn(
      `${player.name} tried to play card ${handCard.card.name} on invalid target ${target.card.name}`
    );
  } else {
    player.playHandCard(handCard, target, optionalParameters);
  }
  emitState(io, match);
}

/**
 * Handles retracting a sub card stack from one of the player's card stacks.
 * @param io server instance used to emit the new state to both players
 * @param match match the acting player belongs to
 * @param player acting player
 * @param rootCardStackUUID uuid of the card stack to retract from
 * @param subCardStackUUID uuid of the card stack to retract
 */
function onRetract(
  io: Server,
  match: Match,
  player: Player,
  rootCardStackUUID: string,
  subCardStackUUID: string
) {
  const rootCardStack = getCardStackByUUID(player.cardStacks, rootCardStackUUID);
  const subCardStack = rootCardStack && getCardStackByUUID(rootCardStack.cardStacks, subCardStackUUID);
  if (!rootCardStack) {
    logger.warn(`${player.name} tried to retract from non-existing card stack ${rootCardStackUUID}`);
  } else if (!subCardStack) {
    logger.warn(
      `${player.name} tried to retract non-existing card ${subCardStackUUID} from card stack ${rootCardStackUUID}`
    );
  } else if (!subCardStack.canBeRetracted) {
    logger.warn(`${player.name} tried to retract non-retractable card ${subCardStack.card.name}`);
  } else {
    subCardStack.retract();
  }
  emitState(io, match);
}

/**
 * Handles discarding a hand card; only allowed while the player is above the hand card limit.
 * @param io server instance used to emit the new state to both players
 * @param match match the acting player belongs to
 * @param player acting player
 * @param handCardUUID uuid of the hand card to discard
 */
function onDiscard(io: Server, match: Match, player: Player, handCardUUID: string) {
  const handCard = getCardStackByUUID(player.hand, handCardUUID);
  if (!handCard) {
    logger.warn(`${player.name} tried to discard non-existing card ${handCardUUID}`);
  } else if (player.handCardLimit >= player.hand.length) {
    logger.warn(`${player.name} tried to discard card despite not over hand card limit`);
  } else {
    player.discardHandCards(handCardUUID);
    match.prepareEndPhase();
  }
  emitState(io, match);
}

/**
 * Handles an attack: with all weapons at once (see {@link constants.attackAllID}) or with a
 * single ship's weapon.
 * @param io server instance used to emit the new state to both players
 * @param match match the acting player belongs to
 * @param player acting player
 * @param shipUUID uuid of the attacking ship, or the attack-all placeholder
 * @param weaponUUID uuid of the attacking weapon, or the attack-all placeholder
 * @param targetId uuid of the attacked card stack
 */
function onAttack(
  io: Server,
  match: Match,
  player: Player,
  shipUUID: string,
  weaponUUID: string,
  targetId: string
) {
  const target = match.battle.ships[match.waitingPlayerNo].find(cs => cs.uuid == targetId);
  if (!target) {
    logger.warn(`${player.name} tried to attack non-existing target ${targetId}`);
  } else if (shipUUID == constants.attackAllID) {
    match.planAttackWithAllWeapons(target);
  } else {
    const playerShips = match.battle.ships[match.pendingActionPlayerNo];
    const srcShip = playerShips.find(cs => cs.uuid == shipUUID);
    const srcWeapon = getCardStackByUUID(srcShip?.cardStacks ?? [], weaponUUID);
    if (!srcWeapon) {
      logger.warn(`${player.name} tried to attack from invalid weapon`);
    } else if (!srcWeapon.canAttack) {
      logger.warn(`${player.name} tried to attack with a card ${srcWeapon.card.name} which cannot attack`);
    } else {
      match.planAttack(srcWeapon, target);
    }
  }
  emitState(io, match);
}

/**
 * Handles a surrender: ends the game with the surrendering player as the loser.
 * @param io server instance used to emit the new state to both players
 * @param match match the surrendering player belongs to
 * @param player surrendering player
 */
function onSurrender(io: Server, match: Match, player: Player) {
  if (!match.gameResult.gameOver) {
    logger.info(`Player ${player.name} surrendered`);
    match.gameResult.setWinnerBySurrender(player);
  }
  emitState(io, match);
}

/**
 * Decrements the countdown of every running match and emits it to both players. On expiry the
 * pending action player's automatic ready is triggered instead of a timeout victory.
 * @param io server instance to find the match sockets on
 */
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
      if (--match.countdown <= 0) {
        // Trigger automatic ready event instead of timeout victory
        match.pendingActionPlayer.handleAutomaticReady();
        emitState(io, match);
      }
      match.forAllPlayers((playerNo: number) => {
        const socket = getSocket(io, match, playerNo);
        if (socket)
          socket.emit(MsgTypeOutbound.Countdown, match.countdown, match.pendingActionPlayerNo == playerNo);
        else logger.warn('Could not find socket to emit countdown');
      });
    });
}

/**
 * Runs `f` with the match and player of the given socket, if both are initialized; logs a
 * warning and does nothing otherwise.
 * @param socket socket to look up the match and player on
 * @param f callback receiving the initialized match and player
 */
function doWithMatchAndPlayer(socket: Socket, f: (m: Match, p: Player) => void) {
  const match = getSocketData(socket).match;
  const player = getPlayer(socket);
  if (match && player) f(match, player);
  else logger.warn(`Match or player in socket ${socket.id} not initialized`);
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

/**
 * Emits the current match state, projected per player, to both players and resets the match's
 * temporary states afterwards.
 * @param io server instance used to look up the players' sockets
 * @param match match whose state is emitted
 */
function emitState(io: Server, match: Match) {
  match.forAllPlayers((playerNo: number) => {
    const socket = getSocket(io, match, playerNo);
    if (socket) socket.emit(MsgTypeOutbound.State, toClientState(match, playerNo));
    else logger.warn('Could not find socket to emit state');
  });
  match.resetTempStates();
}

/**
 * Starts a match once both players readied: nominates the second player, shuffles and draws
 * the initial hands and prepares the first start phase.
 * @param io server instance used to emit the new state to both players
 * @param match match to initialize
 */
function initMatch(io: Server, match: Match) {
  match.setSecondPlayer();
  match.players.forEach(player => {
    player.shuffleDeck();
    player.drawCards(rules.initialCardsToDraw);
  });
  match.prepareStartPhase();
  emitState(io, match);
}

/**
 * Verifies that the player may ready the given turn phase: the hand card limit must be kept
 * in the End phase and no card stack may have insufficient energy.
 * @param player player readying the phase
 * @param turnPhase turn phase to ready
 * @returns true if the player meets all ready conditions
 */
export function verifyReadyConditions(player: Player, turnPhase: TurnPhase): boolean {
  if (turnPhase == TurnPhase.End && player.hand.length > player.handCardLimit) {
    return false;
  }
  if (player.cardStacks.some(cs => cs.hasInsufficientEnergy)) {
    return false;
  }
  return true;
}
