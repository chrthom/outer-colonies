import Player from './player';
import { rules } from '../../shared/config/rules';
import { BattleType, CardDurability, CardType, MsgTypeOutbound, TurnPhase } from '../../shared/config/enums';
import Battle from './battle';
import ClientPlannedBattle from '../../shared/interfaces/client_planned_battle';
import CardStack from '../cards/card_stack';
import { opponentPlayerNo, spliceCardStackByUUID } from '../utils/helpers';
import { Server, Socket } from 'socket.io';
import GameResult from './game_result';
import Intervention, {
  InterventionAttack,
  InterventionBattleRoundEnd,
  InterventionOpponentRaidStart,
  InterventionOpponentTurnStart
} from './intervention';
import SocketData from './socket_data';
import toClientState from '../converters/client_state_converter';
import Card from '../cards/card';

type Players = [player1: Player, player2: Player];

/**
 * Describes the bot player of a match. Passed to the Match constructor
 * instead of a second human socket to create a bot-controlled player.
 */
export class BotPlayerSetup {
  constructor(
    readonly name: string,
    readonly deck: Card[]
  ) {}
}

/**
 * Minimal interface of the singleplayer bot attached to a match. Declared here
 * so that Match does not have to depend on the bot implementation.
 */
export interface MatchBot {
  readonly playerNo: number;
  act(io: Server): void;
}

export function isBotPlayerSetup(player: Socket | BotPlayerSetup): player is BotPlayerSetup {
  return player instanceof BotPlayerSetup;
}

export default class Match {
  readonly room!: string;
  players: Players;
  activePlayerNo: number = 0;
  pendingActionPlayerNo: number = 0;
  turnPhase!: TurnPhase;
  battle: Battle = new Battle(BattleType.None, 0);
  countdown: number = rules.countdownTimer;
  control: number = 0;
  gameResult!: GameResult;
  intervention?: Intervention;
  highlightCard?: CardStack;
  bot?: MatchBot;
  constructor(room: string, player1: Socket | BotPlayerSetup, player2: Socket | BotPlayerSetup) {
    this.room = room;
    this.turnPhase = TurnPhase.Init;
    this.gameResult = new GameResult(this);
    this.players = [this.newPlayer(player1, 0), this.newPlayer(player2, 1)];
  }
  get activePlayer(): Player {
    return this.players[this.activePlayerNo];
  }
  get inactivePlayer(): Player {
    return this.players[this.inactivePlayerNo];
  }
  get inactivePlayerNo(): number {
    return opponentPlayerNo(this.activePlayerNo);
  }
  get pendingActionPlayer(): Player {
    return this.players[this.pendingActionPlayerNo];
  }
  get waitingPlayer(): Player {
    return this.players[this.waitingPlayerNo];
  }
  get waitingPlayerNo(): number {
    return opponentPlayerNo(this.pendingActionPlayerNo);
  }
  switchPendingPlayer() {
    this.pendingActionPlayerNo = this.waitingPlayerNo;
  }
  forAllPlayers(f: (playerNo: number) => void) {
    f(0);
    f(1);
  }
  get allCardStacks(): CardStack[] {
    return this.players.flatMap(p => p.cardStacks);
  }
  resetTempStates() {
    this.countdown = rules.countdownTimer;
    this.battle.resetRecentAttack();
    this.highlightCard = undefined;
  }
  /**
   * Marks the player who will NOT take the first turn: the player with the larger deck,
   * or a random player on equal deck sizes. startMatch() calls prepareStartPhase() right
   * after, which flips activePlayerNo, so the player with the smaller deck takes the
   * first turn.
   */
  setSecondPlayer() {
    if (this.players[0].deck.length > this.players[1].deck.length) this.activePlayerNo = 0;
    else if (this.players[0].deck.length < this.players[1].deck.length) this.activePlayerNo = 1;
    else this.activePlayerNo = Math.round(Math.random());
  }
  prepareStartPhase() {
    this.activePlayerNo = opponentPlayerNo(this.activePlayerNo);
    this.pendingActionPlayerNo = this.activePlayerNo;
    this.turnPhase = TurnPhase.Start;
    this.battle = new Battle(BattleType.None, this.activePlayerNo);
    this.activePlayer.resetRemainingActions();
    this.activePlayer.callBackShipsFromNeutralZone();
    this.activePlayer.drawCards(rules.cardsToDrawPerTurn);
    this.activePlayer.cardStacks.forEach(cs => cs.onStartTurn());
    this.activePlayer.cardStacks
      .flatMap(cs => cs.cardStacks)
      .filter(cs => cs.card.durability == CardDurability.Turn)
      .forEach(cs2 => cs2.discard());
    this.reactivateAllCardStacks();
    new InterventionOpponentTurnStart(this).init();
  }
  prepareBuildPhase() {
    this.pendingActionPlayerNo = this.activePlayerNo;
    this.turnPhase = TurnPhase.Build;
  }
  prepareBuildPhaseReaction(plannedBattle: ClientPlannedBattle) {
    this.battle = Battle.fromClientPlannedBattle(this, plannedBattle);
    if (this.battle.type == BattleType.None) this.prepareEndPhase();
    else {
      this.pendingActionPlayerNo = opponentPlayerNo(this.activePlayerNo);
      if (this.battle.type == BattleType.Raid) new InterventionOpponentRaidStart(this).init();
    }
  }
  prepareCombatPhase(interceptingShipIds: string[]) {
    this.turnPhase = TurnPhase.Combat;
    this.battle.assignInterceptingShips(this.inactivePlayer, interceptingShipIds);
    this.battle.range = Math.min(this.battle.maxWeaponRange, rules.maxRange) + 1;
    this.reactivateAllCardStacks();
    this.processBattleRound();
  }
  prepareEndPhase() {
    this.turnPhase = TurnPhase.End;
    this.pendingActionPlayerNo = this.activePlayerNo;
    this.battle = new Battle(BattleType.None, this.activePlayerNo);
    this.activePlayer.moveFlightReadyShipsToOrbit();
    if (this.activePlayer.hand.length <= this.activePlayer.handCardLimit && !this.gameResult.gameOver) {
      this.activePlayer.cardStacks.forEach(cs => cs.onEndTurn());
      this.prepareStartPhase();
    }
  }
  processBattleRound() {
    if (this.pendingActionPlayerNo == this.inactivePlayerNo) {
      // End of battle round
      new InterventionBattleRoundEnd(this).init();
    } else {
      // Switch to opponent player in same battle round
      this.battle.processBattleRound(this);
    }
  }
  planAttack(srcWeapon: CardStack, target: CardStack) {
    new InterventionAttack(this, srcWeapon, target).init();
  }
  checkToNextPhase() {
    this.intervention?.checkSkip();
  }
  skipIntervention() {
    this.intervention?.skip();
  }
  removeDestroyedCardStacks(): CardStack[] {
    this.players.forEach(player => {
      this.getDestroyedCardStacks(player).forEach(cs => cs.onDestruction());
    });
    return this.players
      .map(player => {
        const destroyedCardStacks = this.getDestroyedCardStacks(player).filter(
          cs => cs.type != CardType.Colony
        );
        destroyedCardStacks.forEach(cs => spliceCardStackByUUID(player.cardStacks, cs.uuid));
        player.discardPile.push(...destroyedCardStacks.flatMap(cs => cs.cards));
        return destroyedCardStacks;
      })
      .flat();
  }
  reactivateAllCardStacks(rechargingAttribtuesOnly: boolean = false) {
    this.players.forEach(player => {
      player.cardStacks.forEach(cs => cs.combatPhaseReset(!rechargingAttribtuesOnly));
    });
  }
  adjustControl(control: number) {
    this.control += control;
    if (this.control >= rules.controlLimit) this.gameResult.setWinnerByDomination(this.players[1]);
    else if (this.control <= -rules.controlLimit) this.gameResult.setWinnerByDomination(this.players[0]);
  }
  private newPlayer(player: Socket | BotPlayerSetup, playerNo: number): Player {
    if (isBotPlayerSetup(player)) {
      return new Player(undefined, player.name, this, playerNo, player.deck, true);
    }
    player.join(this.room);
    const socketData: SocketData = <SocketData>player.data;
    socketData.match = this;
    socketData.playerNo = playerNo;
    return new Player(player.id, socketData.user.username, this, playerNo, socketData.activeDeck.slice());
  }
  private getDestroyedCardStacks(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.damage > 0 && cs.damage >= cs.profile.hp);
  }
  /**
   * Ready up a player for match initialization. Returns true when both players
   * are ready and the match can be started via startMatch().
   */
  setReadyAndCheck(playerNo: number): boolean {
    this.players[playerNo].ready = true;
    return this.players.every(player => player.ready);
  }
  /**
   * Initializes a fully set up match: determines the starting player, shuffles
   * both decks, draws the initial hands and starts the first turn.
   */
  startMatch() {
    this.setSecondPlayer();
    this.players.forEach(player => {
      player.shuffleDeck();
      player.drawCards(rules.initialCardsToDraw);
    });
    this.prepareStartPhase();
  }
  /**
   * Emits the current state to every connected (human) player and resets
   * temporary match states afterwards. Bot players have no socket and are
   * skipped.
   */
  emitState(io: Server) {
    this.forAllPlayers((playerNo: number) => {
      const player = this.players[playerNo];
      if (player.isBot) return;
      const socket = player.socketId ? io.sockets.sockets.get(player.socketId) : undefined;
      if (socket) socket.emit(MsgTypeOutbound.State, toClientState(this, playerNo));
      else console.log('WARN: Could not find socket to emit state');
    });
    this.resetTempStates();
  }
}
