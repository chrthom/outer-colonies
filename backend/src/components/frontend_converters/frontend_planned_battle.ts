import { BattleType } from "../config/enums";
import Battle, { BattleMission, BattleNone, BattleRaid } from "../game_state/battle";
import Match from "../game_state/match";
import { getCardStackByUUID } from "../utils/utils";

export class FrontendPlannedBattle {
    type: BattleType;
    downsideCardsNum: number;
    upsideCardsIndex: Array<number>;
    shipIds: Array<string>;
}

export default function toBattle(match: Match, plannedBattle: FrontendPlannedBattle): Battle {
    const ships = plannedBattle.shipIds.map(id => getCardStackByUUID(match.getActivePlayer().cardStacks, id));
    if (plannedBattle.shipIds.length == 0) return new BattleNone();
    switch(plannedBattle.type) {
        case BattleType.Mission:
            const downsideCards = match.getActivePlayer().pickCardsFromDeck(plannedBattle.downsideCardsNum);
            return new BattleMission(ships, downsideCards, []); // TODO: Also map upside price cards
        case BattleType.Raid:
            return new BattleRaid(ships);
        default:
            return new BattleNone();
    }
}