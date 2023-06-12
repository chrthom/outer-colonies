import { BattleType, TurnPhase } from "../../../../backend/src/components/config/enums";
import { FrontendPlannedBattle } from "../../../../backend/src/components/frontend_converters/frontend_planned_battle";
import Layout from "../../config/layout";
import Game from "../../scenes/game";
import CardImage from "./card_image";
import ValueIndicator from "./indicators/value_indicator";

const layout = new Layout();

export default class DiscardPile extends CardImage {
    cardIds: Array<number>;
    indicator: ValueIndicator;
    constructor(scene: Game, cardIds: Array<number>) {
        const topCard = cardIds.length == 0 ? 1 : cardIds[cardIds.length - 1];
        super(scene, layout.discardPile.x, layout.discardPile.y, topCard);
        this.cardIds = cardIds;
        if (cardIds.length == 0) {
            this.sprite.visible = false;
        } else {
            this.enableMouseover(scene);
            this.sprite.on('pointerdown', () => {
                this.onClickAction(scene);
            });
        }
    }
    update(scene: Game) {
        if (this.indicator) this.indicator.destroy();
        if (this.cardIds.length > 0) {
            const cardsForMission = scene.plannedBattle.upsideCardsNum;
            this.indicator = new ValueIndicator(
                scene,
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
    private onClickAction(scene: Game) {
        if (scene.state 
                && scene.state.playerPendingAction 
                && scene.state.playerIsActive 
                && scene.state.turnPhase == TurnPhase.Build
                && !scene.activeHandCard) {
            if (FrontendPlannedBattle.cardLimitReached(scene.plannedBattle)) {
                scene.resetWithBattleType(BattleType.None);
            } else if (scene.plannedBattle.upsideCardsNum < this.cardIds.length) {
                if (scene.plannedBattle.type != BattleType.Mission) {
                    scene.resetWithBattleType(BattleType.Mission);
                }
                if (!FrontendPlannedBattle.cardLimitReached(scene.plannedBattle)) {
                    scene.plannedBattle.upsideCardsNum++;
                    scene.updateView();
                }
            }
        }
    }
}
