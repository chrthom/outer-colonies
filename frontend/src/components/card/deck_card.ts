import CardImage from "./card_image";
import Layout from "../../config/layout";
import Game from "../../scenes/game";
import { BattleType, TurnPhase } from "../../../../backend/src/components/config/enums";
import ValueIndicator from "./indicators/value_indicator";

const layout = new Layout();

export default class DeckCard extends CardImage {
    indicator: ValueIndicator;
    constructor(scene: Game) {
        super(scene, layout.deck.x, layout.deck.y, 1);
        this.sprite.on('pointerdown', () => {
            this.onClickAction(scene);
        });
    }
    update(scene: Game) {
        if (this.indicator) this.indicator.destroy();
        this.indicator = new ValueIndicator(
            scene,
            scene.state.deckSize,
            scene.state.deckSize < 10,
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
            scene.resetWithBattleType(scene.plannedBattle.type == BattleType.Mission ? BattleType.None : BattleType.Mission);
        }
    }
}