import Player from './player';
import { rules } from '../config/rules';
import { BattleType, CardType, GameResultType, TurnPhase } from '../config/enums';
import Battle from './battle';
import { ClientPlannedBattle } from '../shared_interfaces/client_planned_battle';
55;
import CardStack from '../cards/card_stack';
import { opponentPlayerNo } from '../utils/helpers';
import DBCredentialsDAO from '../persistence/db_credentials';
import DBProfilesDAO from '../persistence/db_profiles';
import DBDailiesDAO from '../persistence/db_dailies';
import { userInfo } from 'os';

export default class Match {
  readonly room!: string;
  players: Player[] = [];
  activePlayerNo: number = 0;
  actionPendingByPlayerNo: number = 0;
  turnPhase!: TurnPhase;
  battle: Battle;
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
    return this.players.flatMap((p) => p.cardStacks);
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
    this.getActivePlayer().cardStacks.forEach((cs) => cs.onStartTurn());
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
  prepareCombatPhase(interveningShipIds: string[]) {
    this.turnPhase = TurnPhase.Combat;
    this.battle.assignInterveningShips(this.getInactivePlayer(), interveningShipIds);
    this.players.forEach((player) => {
      player.cardStacks.forEach((cs) => cs.combatPhaseReset(true));
    });
    this.processBattleRound();
  }
  prepareEndPhase() {
    this.turnPhase = TurnPhase.End;
    this.actionPendingByPlayerNo = this.activePlayerNo;
    this.battle = new Battle(BattleType.None);
    this.getActivePlayer().moveFlightReadyShipsToOrbit();
    // ISSUE #3: End of turn effect (just execute them once)
    if (
      this.getActivePlayer().hand.length <= this.getActivePlayer().handCardLimit() &&
      !this.gameResult.gameOver
    ) {
      this.getActivePlayer().cardStacks.forEach((cs) => cs.onEndTurn());
      this.prepareStartPhase();
    }
  }
  processBattleRound() {
    this.battle.processBattleRound(this);
  }
}

export class GameResult {
  match!: Match;
  gameOver: boolean = false;
  winnerNo?: number;
  type?: GameResultType;
  constructor(match: Match) {
    this.match = match;
  }
  setWinnerByDeckDepletion(depletedPlayer: Player) {
    this.type = GameResultType.Depletion;
    this.setGameOver(depletedPlayer);
  }
  setWinnerByDestruction(destroyedPlayer: Player) {
    this.type = GameResultType.Destruction;
    this.setGameOver(destroyedPlayer);
  }
  setWinnerBySurrender(surrenderingPlayer: Player) {
    this.type = GameResultType.Surrender;
    this.setGameOver(surrenderingPlayer);
  }
  private setGameOver(loser: Player) {
    this.gameOver = true;
    this.winnerNo = opponentPlayerNo(loser.no);
    const winner = this.match.players[this.winnerNo];
    this.applyEarnings(winner, loser, true);
    this.applyEarnings(loser, winner, false);
  }
  private applyEarnings(player: Player, opponent: Player, won: boolean): number {
    let sol = 0;
    if (won) sol += rules.gameEarnings.victory;
    sol += player.discardPile.length * rules.gameEarnings.discardPile;
    sol += opponent.getColonyCardStack().damage * rules.gameEarnings.dealtColonyDamage;
    sol += player.cardStacks.flatMap(c => c.getCards).length * rules.gameEarnings.cardsInGame;
    DBCredentialsDAO.getByUsername(player.name).then(c => {
      DBProfilesDAO.increaseSol(c.userId, sol);
      if (won) DBDailiesDAO.achieveVictory(c.userId);
      if (this.type != GameResultType.Surrender) DBDailiesDAO.achieveGame(c.userId);
      if (player.getColonyCardStack().profile().energy >= 6) DBDailiesDAO.achieveEnergy(c.userId);
      if (player.cardStacks.filter(c => c.isFlightReady()).length >= 5) DBDailiesDAO.achieveShips(c.userId);
    });
    return sol;
  }
}
