import CardImage from "./card_image";
import Layout from "../../config/layout";
import Game from "../../scenes/game";

const layout = new Layout();

export default class MaxCard extends CardImage {
    constructor(scene: Game) {
        super(scene, layout.maxCard.x, layout.maxCard.y, 'back', false, layout.maxCard.scale);
        this.hide();
    }
    hide() {
        this.sprite.visible = false;
    }
    show(cardId: string) {
        this.sprite.setTexture(`card_${cardId}`);
        this.sprite.visible = true;
    }
}