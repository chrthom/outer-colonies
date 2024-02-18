import { BattleType } from '../config/enums';
import { rules } from '../config/rules';

interface ClientPlannedBattle {
  type: BattleType;
  downsideCardsNum: number;
  upsideCardsNum: number;
  shipIds: string[];
}

export default ClientPlannedBattle;

export class ClientPlannedBattleHelper {
  static cardLimitReached(plannedBattle: ClientPlannedBattle): boolean {
    return ClientPlannedBattleHelper.missingCards(plannedBattle) == 0;
  }
  static missingCards(plannedBattle: ClientPlannedBattle): number {
    return rules.cardsPerMission - plannedBattle.downsideCardsNum - plannedBattle.upsideCardsNum;
  }
  static get empty(): ClientPlannedBattle {
    return {
      type: BattleType.None,
      downsideCardsNum: 0,
      upsideCardsNum: 0,
      shipIds: []
    };
  }
}
