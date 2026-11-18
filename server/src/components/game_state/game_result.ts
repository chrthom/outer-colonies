import { CardType, GameResultType, DailyType } from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';
import DBDailiesDAO from '../persistence/db_dailies';
import DBProfilesDAO from '../persistence/db_profiles';
import { opponentPlayerNo } from '../utils/helpers';
import { logger } from '../utils/logger';
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
    this.setGameOver(GameResultType.Depletion, depletedPlayer);
  }
  setWinnerByDestruction(destroyedPlayer: Player) {
    this.setGameOver(GameResultType.Destruction, destroyedPlayer);
  }
  setWinnerByDomination(dominatedPlayer: Player) {
    this.setGameOver(GameResultType.Domination, dominatedPlayer);
  }
  setWinnerBySurrender(surrenderingPlayer: Player) {
    this.setGameOver(GameResultType.Surrender, surrenderingPlayer);
  }
  private setGameOver(type: GameResultType, loser: Player) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.type = type;
    this.winnerNo = opponentPlayerNo(loser.no);
    const winner = this.match.players[this.winnerNo];
    const botGame = winner.isBot || loser.isBot;
    this.winnerSol = this.halveSolInBotGame(this.computeEarnings(winner, loser, true), botGame);
    this.loserSol = this.halveSolInBotGame(this.computeEarnings(loser, winner, false), botGame);
    if (!winner.isBot) void this.persistEarnings(winner, loser, true, this.winnerSol);
    if (!loser.isBot) void this.persistEarnings(loser, winner, false, this.loserSol);
  }
  private halveSolInBotGame(sol: number, botGame: boolean): number {
    return botGame ? Math.floor(sol / 2) : sol;
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
        return (
          readyCardStacks.find(cs => cs.cardStacks.filter(sub => sub.owner == player).length >= 7) !==
          undefined
        );
      default:
        return false; // Login achievement is handled separately in auth
    }
  }

  computeEarnings(player: Player, opponent: Player, won: boolean): number {
    let sol = 0;
    sol += player.discardPile.length * rules.gameEarnings.discardPile;
    sol += opponent.colonyCardStack.damage * rules.gameEarnings.dealtColonyDamage;
    // Count per owning player so opponent attachments (e.g. 437 Kopfgeld on one of
    // this player's ships) do not pay cards-in-game sol to the stack owner
    const ingameCards =
      player.cardStacks.flatMap(c => c.cardStacks).filter(cs => cs.owner == player).length - 1;
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
    // Bot players have no user account to persist earnings for (their user id
    // is undefined); setGameOver already skips them, this guards later callers
    if (player.userId == undefined) return;
    try {
      // The user id is carried on the player (from the authenticated socket data), so no
      // username-based database lookup is needed here - usernames are not a stable join key
      await DBProfilesDAO.increaseSol(player.userId, sol);
      for (const dailyType of Object.values(DailyType)) {
        if (this.shouldAchieveDaily(dailyType, player, opponent, won)) {
          try {
            await DBDailiesDAO.achieve(player.userId, dailyType);
          } catch (err) {
            logger.error(`Failed to record daily ${dailyType} for user ${player.userId}: ${err}`);
          }
        }
      }
    } catch (err) {
      logger.error(`Failed to persist earnings for user ${player.userId}: ${err}`);
    }
  }
}
