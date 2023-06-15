import { FrontendCard } from "../../../../backend/src/components/frontend_converters/frontend_state";
import Game from "../../scenes/game";
import CardImage from "./card_image";
import RetractCardButton from "./indicators/retract_card_button";

export default class Card extends CardImage {
    data: FrontendCard;
    retractCardButton?: RetractCardButton;
    constructor(scene: Game, x: number, y: number, opponentCard: boolean, cardStackUUID: string, data: FrontendCard) {
        super(scene, x, y, data.id, opponentCard);
        this.data = data;
        if (data.retractable) {
            this.retractCardButton = new RetractCardButton(scene, x, y, cardStackUUID, data.index, data.insufficientEnergy);
        }
    }
    destroy() {
        super.destroy();
        if (this.retractCardButton) this.retractCardButton.destroy();
    }
    tween(tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig) {
        super.tween(tweenConfig);
        if (this.retractCardButton) this.retractCardButton.tween(tweenConfig.x, tweenConfig.y);
    }
}