import Card from "../cards/card";
import CardStack from "../cards/card_stack";
import { BattleType, Zone } from "../config/enums";
import { rules } from "../config/rules";
import toBattle, { FrontendPlannedBattle } from "../frontend_converters/frontend_planned_battle";
import { getCardStackByUUID, spliceCardStackByUUID } from "../utils/utils";
import Match from "./match";
import Player from "./player";

export default class Battle {
    type!: BattleType;
    ships: Array<Array<CardStack>> = [ [], [] ];
    downsidePriceCards: Array<Card> = [];
    upsidePriceCards: Array<Card> = [];
    range: number = rules.maxRange + 1;
    constructor(type: BattleType) {
        this.type = type;
    }
    static fromFrontendPlannedBattle(match: Match, plannedBattle: FrontendPlannedBattle): Battle {
        let battle = toBattle(match, plannedBattle);
        if (battle.type != BattleType.None) {
            battle.ships[match.actionPendingByPlayerNo].forEach(cs => cs.zone = Zone.Neutral);
        }
        return battle;
    }
    assignInterveningShips(player: Player, interveningShipIds: Array<string>) {
        if (this.type == BattleType.Mission) {
            this.ships[player.no] = interveningShipIds
                .map(id => getCardStackByUUID(player.cardStacks, id))
                .filter(cs => cs.isMissionReady);
            this.ships[player.no].map(cs => cs.zone = Zone.Neutral);
        } else if (this.type == BattleType.Raid) {
            player.cardStacks
                .filter(cs => cs.isMissionReady() && !interveningShipIds.includes(cs.uuid))
                .forEach(cs => cs.zone = Zone.Neutral);
            this.ships[player.no] = player.cardStacks
                .filter(cs => cs.zone == Zone.Oribital);
        }
    }
    removeDestroyedCardStacks(playerNo: number): Array<CardStack> {
        return this.ships[playerNo]
            .filter(cs => cs.damage > 0 && cs.damage >= cs.profile().hp)
            .map(cs => spliceCardStackByUUID(this.ships[playerNo], cs.uuid));
    }
    canInterveneMission(interveningPlayerNo: number, cardStack: CardStack): boolean {
        return cardStack.isMissionReady() && (
            this.type == BattleType.Raid
                || this.type == BattleType.Mission
                    && cardStack.profile().speed >= this.ships[this.opponentPlayerNo(interveningPlayerNo)]
                        .map(cs => cs.profile().speed)
                        .reduce((a, b) => Math.min(a, b))
        );
    }
    private opponentPlayerNo(playerNo: number): number {
        return playerNo == 0 ? 1 : 0;
    }
}
