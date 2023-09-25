import { BattleType } from '../config/enums';
import { rules } from '../config/rules';

export class ClientPlannedBattle {
  type: BattleType;
  downsideCardsNum: number;
  upsideCardsNum: number;
  shipIds: string[];
  static cardLimitReached(plannedBattle: ClientPlannedBattle): boolean {
    return ClientPlannedBattle.missingCards(plannedBattle) == 0;
  }
  static missingCards(plannedBattle: ClientPlannedBattle): number {
    return rules.cardsPerMission - plannedBattle.downsideCardsNum - plannedBattle.upsideCardsNum;
  }
}
