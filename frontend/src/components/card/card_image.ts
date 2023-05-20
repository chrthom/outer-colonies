import Layout from "../../config/layout";
import Game from "../../scenes/game";

const layout = new Layout();

export default class CardImage {
    sprite: Phaser.GameObjects.Image;
    cardId: number;
    constructor(scene: Game, x: number, y: number, cardId: number, opponentCard?: boolean, scale?: number) {
        this.cardId = cardId;
        this.sprite = scene.add.image(x, y, `card_${cardId}`)
            .setCrop(41, 41, 740, 1040)
            .setOrigin(0.5, 1)
            .setScale(scale ? scale : layout.cards.scale)
            .setInteractive();
        if (opponentCard) this.sprite.setAngle(180);
    }
    destroy() {
        this.sprite.destroy();
    }
    highlightDisabled() {
        this.highlightReset();
        this.sprite.setTint(0x666666)
    }
    highlightSelected() {
        this.highlightReset();
        this.sprite.setTint(0xff6666, 0xff6666, 0xffffff, 0xffffff);
    }
    highlightReset() {
        this.sprite.setTint(0xffffff);
    }
    enableMouseover(scene: Game) {
        this.sprite.on('pointerover', () => {
            scene.obj.maxCard.show(this.cardId);
        });
        this.sprite.on('pointerout', () => {
            scene.obj.maxCard.hide();
        });
    }
}