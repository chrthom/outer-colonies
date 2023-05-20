import Layout from "../../config/layout";
import Game from "../../scenes/game";
import CardImage from "./card_image";

const layout = new Layout();

export default class DiscardPile extends CardImage {
    cardIds: Array<number>;
    constructor(scene: Game, cardIds: Array<number>) {
        const topCard = cardIds.length == 0 ? 1 : cardIds[cardIds.length - 1];
        super(scene, layout.discardPile.x, layout.discardPile.y, topCard);
        if (cardIds.length == 0) this.sprite.visible = false;
        else this.enableMouseover(scene);
        this.cardIds = cardIds;
    }
}
