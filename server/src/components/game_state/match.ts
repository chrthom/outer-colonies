import Player from './player';
import { rules } from '../../shared/config/rules';
import { BattleType, CardDurability, TurnPhase } from '../../shared/config/enums';
import Battle from './battle';
import { ClientPlannedBattle } from '../../shared/interfaces/client_planned_battle';
import CardStack from '../cards/card_stack';
import { opponentPlayerNo } from '../utils/helpers';
import GameResult from './game_result';

export default class Match {
  readonly room!: string;
  players: Player[] = [];
  activePlayerNo: number = 0;
  actionPendingByPlayerNo: number = 0;
  turnPhase!: TurnPhase;
  battle: Battle = new Battle(BattleType.None);
  gameResult!: GameResult;
  constructor(room: string) {
    this.room = room;
    this.turnPhase = TurnPhase.Init;
    this.gameResult = new GameResult(this);
  }
  getActivePlayer(): Player {
    return this.players[this.activePlayerNo];
  }
  getInactivePlayer(): Player {
    return this.players[this.getInactivePlayerNo()];
  }
  getInactivePlayerNo(): number {
    return opponentPlayerNo(this.activePlayerNo);
  }
  getInPlayCardStacks(): CardStack[] {
    return this.players.flatMap(p => p.cardStacks);
  }
  getPendingActionPlayer(): Player {
    return this.players[this.actionPendingByPlayerNo];
  }
  getWaitingPlayer(): Player {
    return this.players[this.getWaitingPlayerNo()];
  }
  getWaitingPlayerNo(): number {
    return opponentPlayerNo(this.actionPendingByPlayerNo);
  }
  forAllPlayers(f: (playerNo: number) => void) {
    f(0);
    f(1);
  }
  setStartPlayer() {
    if (this.players[0].deck.length > this.players[1].deck.length) this.activePlayerNo = 0;
    else if (this.players[0].deck.length < this.players[1].deck.length) this.activePlayerNo = 1;
    else this.activePlayerNo = Math.round(Math.random());
  }
  prepareStartPhase() {
    this.activePlayerNo = opponentPlayerNo(this.activePlayerNo);
    this.actionPendingByPlayerNo = this.activePlayerNo;
    this.turnPhase = TurnPhase.Start;
    this.battle = new Battle(BattleType.None);
    this.getActivePlayer().resetRemainingActions();
    this.getActivePlayer().callBackShipsFromNeutralZone();
    this.getActivePlayer().drawCards(rules.cardsToDrawPerTurn);
    this.getActivePlayer().cardStacks.forEach(cs => cs.onStartTurn());
    this.getActivePlayer()
      .cardStacks.flatMap(cs => cs.cardStacks)
      .filter(cs => cs.card.durability == CardDurability.Turn)
      .forEach(cs2 => cs2.discard());
    this.prepareBuildPhase();
  }
  prepareBuildPhase() {
    this.turnPhase = TurnPhase.Build;
  }
  prepareBuildPhaseReaction(plannedBattle: ClientPlannedBattle) {
    this.battle = Battle.fromClientPlannedBattle(this, plannedBattle);
    if (this.battle.type == BattleType.None) this.prepareEndPhase();
    else this.actionPendingByPlayerNo = opponentPlayerNo(this.activePlayerNo);
  }
  prepareCombatPhase(interceptingShipIds: string[]) {
    this.turnPhase = TurnPhase.Combat;
    this.battle.assignInterceptingShips(this.getInactivePlayer(), interceptingShipIds);
    this.players.forEach(player => {
      player.cardStacks.forEach(cs => cs.combatPhaseReset(true));
    });
    this.processBattleRound();
  }
  prepareEndPhase() {
    this.turnPhase = TurnPhase.End;
    this.actionPendingByPlayerNo = this.activePlayerNo;
    this.battle = new Battle(BattleType.None);
    this.getActivePlayer().moveFlightReadyShipsToOrbit();
    if (
      this.getActivePlayer().hand.length <= this.getActivePlayer().handCardLimit &&
      !this.gameResult.gameOver
    ) {
      this.getActivePlayer().cardStacks.forEach(cs => cs.onEndTurn());
      this.prepareStartPhase();
    }
  }
  processBattleRound() {
    this.battle.processBattleRound(this);
  }
}
