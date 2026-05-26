import { CardType, GameResultType, DailyType } from '../../shared/config/enums';
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

  setWinnerByDeckDepletion(depletedPlayer: Player) {
    this.type = GameResultType.Depletion;
    this.setGameOver(depletedPlayer);
  }
  setWinnerByDestruction(destroyedPlayer: Player) {
    this.type = GameResultType.Destruction;
    this.setGameOver(destroyedPlayer);
  }
  setWinnerByDomination(dominatedPlayer: Player) {
    this.type = GameResultType.Domination;
    this.setGameOver(dominatedPlayer);
  }
  setWinnerBySurrender(surrenderingPlayer: Player) {
    this.type = GameResultType.Surrender;
    this.setGameOver(surrenderingPlayer);
  }
  private setGameOver(loser: Player) {
    this.gameOver = true;
    this.winnerNo = opponentPlayerNo(loser.no);
    const winner = this.match.players[this.winnerNo];
    this.winnerSol = this.computeEarnings(winner, loser, true);
    this.loserSol = this.computeEarnings(loser, winner, false);
    void this.persistEarnings(winner, loser, true, this.winnerSol);
    void this.persistEarnings(loser, winner, false, this.loserSol);
  }
  private shouldAchieveDaily(dailyType: DailyType, player: Player, opponent: Player, won: boolean): boolean {
    const readyCardStacks = player.cardStacks.filter(cs => cs.isFlightReady);

    switch (dailyType) {
      case DailyType.Victory:
        return won;
      case DailyType.Game:
        return this.type != GameResultType.Surrender;
      case DailyType.Energy:
        return player.colonyCardStack.profile.energy >= 6;
      case DailyType.Ships:
        return readyCardStacks.length >= 5;
      case DailyType.Domination:
        return won && this.type == GameResultType.Domination;
      case DailyType.Destruction:
        return won && this.type == GameResultType.Destruction;
      case DailyType.Control:
        return readyCardStacks.map(cs => cs.profile.control).reduce((a, b) => a + b, 0) >= 10;
      case DailyType.Juggernaut:
        return readyCardStacks.find(cs => cs.profile.hp >= 20) !== undefined;
      case DailyType.Stations:
        return (
          readyCardStacks
            .filter(cs => cs.profile.speed == 0)
            .flatMap(cs => cs.cards)
            .filter(c => c.type == CardType.Hull).length >= 3
        );
      case DailyType.Discard:
        return player.discardPile.length >= 50;
      case DailyType.Colony:
        return player.colonyCardStack.cards.length > 7;
      case DailyType.Colossus:
        return readyCardStacks.find(cs => cs.cards.length >= 7) !== undefined;
      default:
        return false; // Login achievement is handled separately in auth
    }
  }

  computeEarnings(player: Player, opponent: Player, won: boolean): number {
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
    return Math.max(0, sol);
  }

  async persistEarnings(player: Player, opponent: Player, won: boolean, sol: number): Promise<void> {
    try {
      const c = await DBCredentialsDAO.getByUsername(player.name);
      if (!c) {
        console.log(`ERROR: Could not find user ${player.name} in database`);
        return;
      }
      DBProfilesDAO.increaseSol(c.userId, sol);
      // Check all dailies using centralized logic
      for (const dailyType of Object.values(DailyType)) {
        if (this.shouldAchieveDaily(dailyType, player, opponent, won)) {
          try {
            await DBDailiesDAO.achieve(c.userId, dailyType);
          } catch (err) {
            console.log(`ERROR: Failed to record daily ${dailyType} for user ${c.userId}: ${err}`);
          }
        }
      }
    } catch (err) {
      console.log(`ERROR: Failed to persist earnings for user ${player.name}: ${err}`);
    }
  }
}
