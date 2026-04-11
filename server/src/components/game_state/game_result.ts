import { CardType, GameResultType } from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';
import DBCredentialsDAO from '../persistence/db_credentials';
import DBDailiesDAO from '../persistence/db_dailies';
import DBProfilesDAO from '../persistence/db_profiles';
import { opponentPlayerNo } from '../utils/helpers';
import { isDailyOfDay } from '../utils/daily_selector';
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
        if (won) {
          if (isDailyOfDay('victory')) DBDailiesDAO.achieveVictory(c.userId);
          if (this.type == GameResultType.Destruction && isDailyOfDay('destruction'))
            DBDailiesDAO.achieveDestruction(c.userId);
          else if (this.type == GameResultType.Domination && isDailyOfDay('domination'))
            DBDailiesDAO.achieveDomination(c.userId);
        }
        if (this.type != GameResultType.Surrender && isDailyOfDay('game')) DBDailiesDAO.achieveGame(c.userId);
        if (player.colonyCardStack.profile.energy >= 6 && isDailyOfDay('energy'))
          DBDailiesDAO.achieveEnergy(c.userId);
        if (player.discardPile.length >= 50 && isDailyOfDay('discard')) DBDailiesDAO.achieveDiscard(c.userId);
        if (player.colonyCardStack.cards.length > 7 && isDailyOfDay('colony'))
          DBDailiesDAO.achieveColony(c.userId);
        const readyCardStacks = player.cardStacks.filter(cs => cs.isFlightReady);
        if (readyCardStacks.length >= 5 && isDailyOfDay('ships')) DBDailiesDAO.achieveShips(c.userId);
        if (
          readyCardStacks.map(cs => cs.profile.control).reduce((a, b) => a + b, 0) >= 10 &&
          isDailyOfDay('control')
        )
          DBDailiesDAO.achieveControl(c.userId);
        if (readyCardStacks.find(cs => cs.profile.hp >= 20) && isDailyOfDay('juggernaut'))
          DBDailiesDAO.achieveJuggernaut(c.userId);
        if (readyCardStacks.find(cs => cs.cards.length >= 7) && isDailyOfDay('colossus'))
          DBDailiesDAO.achieveColossus(c.userId);
        if (
          readyCardStacks
            .filter(cs => cs.profile.speed == 0)
            .flatMap(cs => cs.cards)
            .filter(c => c.type == CardType.Hull).length >= 3 &&
          isDailyOfDay('stations')
        )
          DBDailiesDAO.achieveStations(c.userId);
      } else {
        console.log(`ERROR: Could not find user ${player.name} in database`);
      }
    });
    return sol;
  }
}
