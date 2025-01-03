import { BattleType } from '../../shared/config/enums';
import Battle from '../game_state/battle';
import Match from '../game_state/match';
import ClientPlannedBattle from '../../shared/interfaces/client_planned_battle';
import { getCardStackByUUID } from '../utils/helpers';
import CardStack from '../cards/card_stack';

export default function toBattle(match: Match, plannedBattle: ClientPlannedBattle): Battle {
  const ships = plannedBattle.shipIds
    .map(id => getCardStackByUUID(match.activePlayer.cardStacks, id))
    .filter((cs): cs is CardStack => !!cs && cs.isMissionReady);
  if (plannedBattle.shipIds.length == 0) return new Battle(BattleType.None, match.pendingActionPlayerNo);
  let battle: Battle;
  const downsideCards = match.activePlayer.pickCardsFromDeck(plannedBattle.downsideCardsNum);
  const upsideCards = match.activePlayer.pickCardsFromTopOfDiscardPile(plannedBattle.upsideCardsNum);
  switch (plannedBattle.type) {
    case BattleType.Mission:
      battle = new Battle(BattleType.Mission, match.pendingActionPlayerNo);
      battle.ships[match.pendingActionPlayerNo] = ships;
      battle.downsidePriceCards = downsideCards;
      battle.upsidePriceCards = upsideCards;
      break;
    case BattleType.Raid:
      battle = new Battle(BattleType.Raid, match.pendingActionPlayerNo);
      battle.ships[match.pendingActionPlayerNo] = ships;
      break;
    default:
      battle = new Battle(BattleType.None, match.pendingActionPlayerNo);
  }
  return battle;
}
