import { BattleType } from '../config/enums';

interface ClientPlannedBattle {
  type: BattleType;
  shipIds: string[];
}

export default ClientPlannedBattle;

export class ClientPlannedBattleHelper {
  static get empty(): ClientPlannedBattle {
    return {
      type: BattleType.None,
      shipIds: []
    };
  }
}
