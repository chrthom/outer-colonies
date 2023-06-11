import { BattleType } from "../config/enums";
import Battle from "../game_state/battle";
import Match from "../game_state/match";
import { getCardStackByUUID } from "../utils/utils";

export class FrontendPlannedBattle {
    type: BattleType;
    downsideCardsNum: number;
    upsideCardsIndex: number[];
    shipIds: string[];
}

export default function toBattle(match: Match, plannedBattle: FrontendPlannedBattle): Battle {
    const ships = plannedBattle.shipIds
        .map(id => getCardStackByUUID(match.getActivePlayer().cardStacks, id))
        .filter(cs => cs.isMissionReady());
    if (plannedBattle.shipIds.length == 0) 
        return new Battle(BattleType.None);
    let battle: Battle;
    switch(plannedBattle.type) {
        case BattleType.Mission:
            const downsideCards = match.getActivePlayer().pickCardsFromDeck(plannedBattle.downsideCardsNum);
            battle = new Battle(BattleType.Mission);
            battle.ships[match.actionPendingByPlayerNo] = ships;
            battle.downsidePriceCards = downsideCards;
            // ISSUE #1: Also map upside price cards
            break;
        case BattleType.Raid:
            battle = new Battle(BattleType.Raid);
            battle.ships[match.actionPendingByPlayerNo] = ships;
            break;
        default:
            battle = new Battle(BattleType.None);
    }
    return battle;
}