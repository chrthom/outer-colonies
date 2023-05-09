import CardImage from "./card_image";
import Layout from "../../config/layout";
import Game from "../../scenes/game";
import { TurnPhase } from "../../../../backend/src/components/config/enums";
import { consts } from "../../../../backend/src/components/config/consts";
import { rules } from "../../../../backend/src/components/config/rules";

const layout = new Layout();

export default class DeckCard extends CardImage {
    constructor(scene: Game) {
        super(scene, layout.deck.x, layout.deck.y, 'back');
        this.sprite.on('pointerdown', () => {
            this.onClickAction(scene);
        });
    }
    private onClickAction(scene: Game) {
        if (scene.state.turnPhase == TurnPhase.Plan && scene.state.playerIsActive) {
            scene.resetPlannedBattle('mission');
            this.highlightSelected();
        }
    }
}