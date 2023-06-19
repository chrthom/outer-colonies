import { BattleType, TurnPhase } from "../../../../backend/src/components/config/enums";
import { FrontendPlannedBattle } from "../../../../backend/src/components/frontend_converters/frontend_planned_battle";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";
import CardImage from "./card_image";
import ValueIndicator from "./indicators/value_indicator";

export default class DiscardPile extends CardImage {
    cardIds: number[] = [];
    indicator: ValueIndicator;
    constructor(scene: Game) {
        super(scene, layout.discardPile.x, layout.discardPile.y, 1);
        this.update([]);
    }
    update(cardIds?: number[]) {
        if (cardIds) this.cardIds = cardIds;
        if (this.indicator) this.indicator.destroy();
        if (this.cardIds.length == 0) {
            this.setVisible(false);
        } else {
            this.setCardId(this.getTopCard());
            this.image
                .off('pointerdown')
                .on('pointerdown', () => this.onClickAction());
            this.setVisible(true);
            this.enableMaximizeOnMouseover();
            const cardsForMission = this.scene.plannedBattle.upsideCardsNum;
            this.indicator = new ValueIndicator(
                this.scene,
                this.cardIds.length + (cardsForMission ? `/-${cardsForMission}` : ''),
                false,
                layout.discardPile.x,
                layout.discardPile.y,
                true,
                true
            );
        }
    }
    destroy() {
        super.destroy();
        if (this.indicator) this.indicator.destroy();
    }
    private getTopCard() {
        return this.cardIds.length == 0 ? 1 : this.cardIds[this.cardIds.length - 1];
    }
    private onClickAction() {
        if (this.scene.state 
                && this.scene.state.playerPendingAction 
                && this.scene.state.playerIsActive 
                && this.scene.state.turnPhase == TurnPhase.Build
                && !this.scene.activeCards.hand) {
            if (FrontendPlannedBattle.cardLimitReached(this.scene.plannedBattle)) {
                this.scene.resetView(BattleType.None);
            } else if (this.scene.plannedBattle.upsideCardsNum < this.cardIds.length) {
                if (this.scene.plannedBattle.type != BattleType.Mission) {
                    this.scene.resetView(BattleType.Mission);
                }
                if (!FrontendPlannedBattle.cardLimitReached(this.scene.plannedBattle)) {
                    this.scene.plannedBattle.upsideCardsNum++;
                    this.scene.updateView();
                }
            }
        }
    }
}
