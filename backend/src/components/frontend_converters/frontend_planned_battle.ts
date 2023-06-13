import { BattleType } from "../config/enums";
import { rules } from "../config/rules";
import Battle from "../game_state/battle";
import Match from "../game_state/match";
import { getCardStackByUUID } from "../utils/utils";

export class FrontendPlannedBattle {
    type: BattleType;
    downsideCardsNum: number;
    upsideCardsNum: number;
    shipIds: string[];
    static cardLimitReached(plannedBattle: FrontendPlannedBattle): boolean {
        return FrontendPlannedBattle.missingCards(plannedBattle) == 0;
    }
    static missingCards(plannedBattle: FrontendPlannedBattle): number {
        return rules.cardsPerMission - plannedBattle.downsideCardsNum - plannedBattle.upsideCardsNum;
    }
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
            const upsideCards = match.getActivePlayer().pickCardsFromTopOfDiscardPile(plannedBattle.upsideCardsNum);
            console.log(plannedBattle.upsideCardsNum); ////
            console.log(upsideCards); ////
            battle = new Battle(BattleType.Mission);
            battle.ships[match.actionPendingByPlayerNo] = ships;
            battle.downsidePriceCards = downsideCards;
            battle.upsidePriceCards = upsideCards;
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