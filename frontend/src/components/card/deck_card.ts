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
        this.image.on('pointerdown', () => {
            this.onClickAction(scene);
        });
    }
    update(scene: Game) {
        if (this.indicator) this.indicator.destroy();
        const cardsForMission = scene.plannedBattle.downsideCardsNum;
        this.indicator = new ValueIndicator(
            scene,
            scene.state.deckSize + (cardsForMission ? `/-${cardsForMission}` : ''),
            scene.state.deckSize - cardsForMission < 10,
            layout.deck.x,
            layout.deck.y,
            true,
            true
        );
    }
    private onClickAction(scene: Game) {
        if (scene.state 
                && scene.state.playerPendingAction 
                && scene.state.playerIsActive 
                && scene.state.turnPhase == TurnPhase.Build
                && !scene.activeHandCard) {
            if (FrontendPlannedBattle.cardLimitReached(scene.plannedBattle)) {
                scene.resetWithBattleType(BattleType.None);
            } else {
                if (scene.plannedBattle.type != BattleType.Mission) {
                    scene.resetWithBattleType(BattleType.Mission);
                }
                if (!FrontendPlannedBattle.cardLimitReached(scene.plannedBattle)) {
                    scene.plannedBattle.downsideCardsNum++;
                    scene.updateView();
                }
            }
        }
    }
}