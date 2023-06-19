import { FrontendCard } from "../../../../backend/src/components/frontend_converters/frontend_state";
import { animationConfig } from "../../config/animation";
import { layout } from "../../config/layout";
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
        this.destroyButton();
    }
    discard(ownedByPlayer: boolean, toDeck?: boolean) {
        const discardPileIds = this.scene.state.discardPileIds.slice();
        this.setDepth(layout.depth.discardCard);
        this.tween({
            targets: undefined,
            duration: animationConfig.duration.move,
            x: toDeck ? layout.deck.x : layout.discardPile.x,
            y: ownedByPlayer ? (toDeck ? layout.deck.y : layout.discardPile.y) : layout.discardPile.yOpponent,
            angle: ownedByPlayer ? 0 : 180,
            onComplete: () => {
                if (!toDeck) this.scene.obj.discardPile.update(discardPileIds);
                this.destroy();
            }
        });
    }
    destroyButton() {
        if (this.retractCardButton) this.retractCardButton.destroy();
    }
    tween(tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig) {
        super.tween(tweenConfig);
        if (this.retractCardButton) this.retractCardButton.tween(tweenConfig.x, tweenConfig.y);
    }
}