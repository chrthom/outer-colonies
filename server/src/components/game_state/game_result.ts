import { GameResultType } from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';
import DBCredentialsDAO from '../persistence/db_credentials';
import DBDailiesDAO from '../persistence/db_dailies';
import DBProfilesDAO from '../persistence/db_profiles';
import { opponentPlayerNo } from '../utils/helpers';
import Match from './match';
import Player from './player';

export default class GameResult {
  match!: Match;
  gameOver: boolean = false;
  winnerNo?: number;
  type?: GameResultType;
  winnerSol: number = 0;
  loserSol: number = 0;
  constructor(match: Match) {
    this.match = match;
  }
  setWinnerByCountdown(timedOutPlayer: Player) {
    this.type = GameResultType.Countdown;
    this.setGameOver(timedOutPlayer);
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
    this.winnerSol = this.applyEarnings(winner, loser, true);
    this.loserSol = this.applyEarnings(loser, winner, false);
  }
  private applyEarnings(player: Player, opponent: Player, won: boolean): number {
    let sol = 0;
    sol += player.discardPile.length * rules.gameEarnings.discardPile;
    sol += opponent.colonyCardStack.damage * rules.gameEarnings.dealtColonyDamage;
    const ingameCards = player.cardStacks.flatMap(c => c.cards).length - 1;
    sol += ingameCards * rules.gameEarnings.cardsInGame;
    if (
      won &&
      (this.type != GameResultType.Surrender ||
        ingameCards + player.discardPile.length >= rules.minCardsForVictoryBonus)
    ) {
      sol += rules.gameEarnings.victory;
    }
    sol = Math.max(0, sol);
    DBCredentialsDAO.getByUsername(player.name).then(c => {
      if (c) {
        DBProfilesDAO.increaseSol(c.userId, sol);
        if (won) DBDailiesDAO.achieveVictory(c.userId);
        if (this.type != GameResultType.Surrender) DBDailiesDAO.achieveGame(c.userId);
        if (player.colonyCardStack.profile.energy >= 6) DBDailiesDAO.achieveEnergy(c.userId);
        if (player.cardStacks.filter(c => c.isFlightReady).length >= 5) DBDailiesDAO.achieveShips(c.userId);
      } else {
        console.log(`ERROR: Could not find user ${player.name} in database`);
      }
    });
    return sol;
  }
}
