import CardImage from "./card_image";
import Layout from "../../config/layout";
import Game from "../../scenes/game";
import { FrontendHandCard } from "../../../../backend/src/components/frontend_converters/frontend_state";

const layout = new Layout();

export default class HandCard extends CardImage {
    uuid: string;
    data: FrontendHandCard;
    constructor(scene: Game, handCardsNum: number, handCardData: FrontendHandCard) {
        const invIndex = handCardsNum - handCardData.index - 1;
        const x = layout.player.hand.x + invIndex * layout.player.hand.xStep;
        const y = layout.player.hand.y + invIndex * layout.player.hand.yStep;
        const angle = layout.player.hand.startAngle + invIndex * layout.player.hand.angleStep;
        super(scene, x, y, handCardData.cardId);
        this.sprite.setAngle(angle);
        this.data = handCardData;
        this.uuid = handCardData.uuid;
        if (handCardData.playable) this.sprite.on('pointerdown', () => {
            this.onClickAction(scene);
        });
        this.enableMouseover(scene);
    }
    highlightPlayability() {
        if (this.data.playable) this.highlightReset();
        else this.highlightDisabled();
    }
    private onClickAction(scene: Game) {
        const reset = scene.activeCard == this.uuid;
        scene.activeCard = null;
        scene.hand.forEach(c => c.highlightPlayability());
        scene.cardStacks.forEach(cs => cs.highlightReset());
        if (!reset) {
            scene.activeCard = this.data.uuid;
            this.highlightSelected();
            scene.cardStacks.forEach(cs => {
                if (!this.data.validTargets.includes(cs.uuid)) cs.highlightDisabled()
            });
        }
    }
}