import Player from './player';
import { rules } from '../../shared/config/rules';
import { BattleType, CardDurability, TurnPhase } from '../../shared/config/enums';
import Battle from './battle';
import ClientPlannedBattle from '../../shared/interfaces/client_planned_battle';
import CardStack from '../cards/card_stack';
import { opponentPlayerNo } from '../utils/helpers';
import GameResult from './game_result';
import Intervention, {
  InterventionAttack,
  InterventionBattleRoundEnd,
  InterventionOpponentTurnStart
} from './intervention';

type Players = [player: Player, opponent: Player];

export default class Match {
  readonly room!: string;
  players!: Players; // Set in matchmaking.ts on init game
  activePlayerNo: number = 0;
  pendingActionPlayerNo: number = 0;
  turnPhase!: TurnPhase;
  battle: Battle = new Battle(BattleType.None);
  gameResult!: GameResult;
  intervention?: Intervention;
  highlightCard?: CardStack;
  constructor(room: string) {
    this.room = room;
    this.turnPhase = TurnPhase.Init;
    this.gameResult = new GameResult(this);
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
    this.battle.resetRecentAttack();
    this.highlightCard = undefined;
  }
  setStartPlayer() {
    if (this.players[0].deck.length > this.players[1].deck.length) this.activePlayerNo = 0;
    else if (this.players[0].deck.length < this.players[1].deck.length) this.activePlayerNo = 1;
    else this.activePlayerNo = Math.round(Math.random());
  }
  prepareStartPhase() {
    this.activePlayerNo = opponentPlayerNo(this.activePlayerNo);
    this.pendingActionPlayerNo = this.activePlayerNo;
    this.turnPhase = TurnPhase.Start;
    this.battle = new Battle(BattleType.None);
    this.activePlayer.resetRemainingActions();
    this.activePlayer.callBackShipsFromNeutralZone();
    this.activePlayer.drawCards(rules.cardsToDrawPerTurn);
    this.activePlayer.cardStacks.forEach(cs => cs.onStartTurn());
    this.activePlayer.cardStacks
      .flatMap(cs => cs.cardStacks)
      .filter(cs => cs.card.durability == CardDurability.Turn)
      .forEach(cs2 => cs2.discard());
    new InterventionOpponentTurnStart(this).init();
  }
  prepareBuildPhase() {
    this.pendingActionPlayerNo = this.activePlayerNo;
    this.turnPhase = TurnPhase.Build;
  }
  prepareBuildPhaseReaction(plannedBattle: ClientPlannedBattle) {
    this.battle = Battle.fromClientPlannedBattle(this, plannedBattle);
    if (this.battle.type == BattleType.None) this.prepareEndPhase();
    else this.pendingActionPlayerNo = opponentPlayerNo(this.activePlayerNo);
  }
  prepareCombatPhase(interceptingShipIds: string[]) {
    this.turnPhase = TurnPhase.Combat;
    this.battle.assignInterceptingShips(this.inactivePlayer, interceptingShipIds);
    this.players.forEach(player => {
      player.cardStacks.forEach(cs => cs.combatPhaseReset(true));
    });
    this.processBattleRound();
  }
  prepareEndPhase() {
    this.turnPhase = TurnPhase.End;
    this.pendingActionPlayerNo = this.activePlayerNo;
    this.battle = new Battle(BattleType.None);
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
}
