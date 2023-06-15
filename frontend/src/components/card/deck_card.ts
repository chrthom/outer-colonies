import CardImage from "./card_image";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";
import { BattleType, TurnPhase } from "../../../../backend/src/components/config/enums";
import ValueIndicator from "./indicators/value_indicator";
import { FrontendPlannedBattle } from "../../../../backend/src/components/frontend_converters/frontend_planned_battle";

export default class DeckCard extends CardImage {
    indicator: ValueIndicator;
    constructor(scene: Game) {
        super(scene, layout.deck.x, layout.deck.y, 1);
        this.image.on('pointerdown', () => this.onClickAction());
    }
    update() {
        if (this.indicator) this.indicator.destroy();
        const cardsForMission = this.scene.plannedBattle.downsideCardsNum;
        this.indicator = new ValueIndicator(
            this.scene,
            this.scene.state.deckSize + (cardsForMission ? `/-${cardsForMission}` : ''),
            this.scene.state.deckSize - cardsForMission < 10,
            layout.deck.x,
            layout.deck.y,
            true,
            true
        );
    }
    private onClickAction() {
        if (this.scene.state 
                && this.scene.state.playerPendingAction 
                && this.scene.state.playerIsActive 
                && this.scene.state.turnPhase == TurnPhase.Build
                && !this.scene.activeHandCard) {
            if (FrontendPlannedBattle.cardLimitReached(this.scene.plannedBattle)) {
                this.scene.resetWithBattleType(BattleType.None);
            } else {
                if (this.scene.plannedBattle.type != BattleType.Mission) {
                    this.scene.resetWithBattleType(BattleType.Mission);
                }
                if (!FrontendPlannedBattle.cardLimitReached(this.scene.plannedBattle)) {
                    this.scene.plannedBattle.downsideCardsNum++;
                    this.scene.updateView();
                }
            }
        }
    }
}