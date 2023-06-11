import Card from "../cards/card";
import CardStack from "../cards/card_stack";
import EquipmentCard from "../cards/types/equipment_card";
import { BattleType, Zone } from "../config/enums";
import { rules } from "../config/rules";
import toBattle, { FrontendPlannedBattle } from "../frontend_converters/frontend_planned_battle";
import { getCardStackByUUID, opponentPlayerNo, spliceCardStackByUUID } from "../utils/utils";
import Match from "./match";
import Player from "./player";

export default class Battle {
    type!: BattleType;
    ships: CardStack[][] = [ [], [] ];
    downsidePriceCards: Card[] = [];
    upsidePriceCards: Card[] = [];
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
    assignInterveningShips(player: Player, interveningShipIds: string[]) {
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
    canInterveneMission(interveningPlayerNo: number, cardStack: CardStack): boolean {
        return cardStack.isMissionReady() && (
            this.type == BattleType.Raid
                || this.type == BattleType.Mission
                    && cardStack.profile().speed >= this.ships[opponentPlayerNo(interveningPlayerNo)]
                        .map(cs => cs.profile().speed)
                        .reduce((a, b) => Math.min(a, b))
        );
    }
    processBattleRound(match: Match) {
        if (match.actionPendingByPlayerNo == opponentPlayerNo(match.activePlayerNo)) {
            this.range--;
            match.players.forEach(player => {
                this.getDestroyedCardStacks(player.no).forEach(cs => cs.onDestruction());
            });
            match.players.forEach(player => {
                const destroyedCardStacks = this.getDestroyedCardStacks(player.no);
                destroyedCardStacks.forEach(cs => spliceCardStackByUUID(this.ships[player.no], cs.uuid));
                destroyedCardStacks.forEach(cs => spliceCardStackByUUID(player.cardStacks, cs.uuid));
                player.discardPile.push(...destroyedCardStacks.flatMap(cs => cs.getCards()));
                player.cardStacks.forEach(cs => cs.combatPhaseReset(false));
            });
            if (this.range == 1 && this.type == BattleType.Raid) {
                this.ships[match.actionPendingByPlayerNo].push(
                    ...match.players[match.actionPendingByPlayerNo].cardStacks.filter(cs => cs.zone == Zone.Colony)
                );
            }
        }
        match.actionPendingByPlayerNo = opponentPlayerNo(match.actionPendingByPlayerNo);
        if (this.range == 0) {
            if (this.type == BattleType.Mission) this.applyMissionResult(match);
            match.prepareEndPhase();
        } else {
            const hasAttack = this.ships[match.actionPendingByPlayerNo]
                .flatMap(cs => cs.getCardStacks())
                .filter(cs => cs.attackAvailable)
                .some(cs => (<EquipmentCard> cs.card).attackProfile.range >= this.range);
            const hasTarget = this.ships[match.getWaitingPlayerNo()].length > 0;
            if (!hasAttack || !hasTarget) this.processBattleRound(match);
        }
    }
    private applyMissionResult(match: Match) {
        if (this.ships[match.activePlayerNo].length > 0) {
            match.getActivePlayer().takeCards(...this.downsidePriceCards); // ISSUE #1: Support upside price cards
        } else {
            match.getActivePlayer().discardCards(...this.downsidePriceCards);
        }
    }
    private getDestroyedCardStacks(playerNo: number): CardStack[] {
        return this.ships[playerNo].filter(cs => cs.damage > 0 && cs.damage >= cs.profile().hp);
    }
}
