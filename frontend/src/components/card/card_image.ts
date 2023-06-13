import Layout from "../../config/layout";
import Game from "../../scenes/game";

const layout = new Layout();

export default class CardImage {
    sprite: Phaser.GameObjects.Image;
    glow?: Phaser.FX.Glow;
    cardId: number;
    constructor(scene: Game, x: number, y: number, cardId: number, opponentCard?: boolean, scale?: number) {
        this.cardId = cardId;
        this.sprite = scene.add
            .image(x, y, `card_${cardId}`)
            .setCrop(41, 41, 740, 1040)
            .setOrigin(0.5, 1)
            .setScale(scale ? scale : layout.cards.scale.normal)
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
        this.glow = this.sprite.postFX.addGlow(layout.colors.secondary, 2, 0, false, 0.05, 16);
    }
    highlightReset() {
        if (this.glow) {
            this.sprite.postFX.remove(this.glow);
            this.glow = null;
        }
        this.sprite.setTint(layout.colors.neutral);
    }
    enableMouseover(scene: Game) {
        this.sprite
            .on('pointerover', () => scene.obj.maxCard.show(this.cardId))
            .on('pointerout', () => scene.obj.maxCard.hide());
    }
}