import { animationConfig } from "../../config/animation";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";

export default class CardImage {
    image!: Phaser.GameObjects.Image;
    cardId!: number;
    private imageHighlight!: Phaser.GameObjects.Image;
    private imageMask!: Phaser.GameObjects.Image;
    private animation?: Phaser.Tweens.Tween;
    constructor(scene: Game, x: number, y: number, cardId: number, opponentCard?: boolean, scale?: number) {
        this.cardId = cardId;
        const setImageProps = (image: Phaser.GameObjects.Image) => image
            .setOrigin(0.5, 1)
            .setAngle(opponentCard ? 180 : 0)
            .setScale(scale ? scale : layout.cards.scale.normal);
        this.imageHighlight = setImageProps(scene.add
            .image(x, y, 'card_glow')
            .setVisible(false)
        );
        this.image = setImageProps(scene.add
            .image(x, y, `card_${cardId}`)
            .setCrop(41, 41, 740, 1040)
            .setInteractive()
        );
        this.imageMask = setImageProps(scene.add
            .image(x, y, 'card_mask')
            .setVisible(false)
        );
        this.image.setMask(this.imageMask.createBitmapMask());
    }
    destroy() {
        this.image.destroy();
        this.imageHighlight.destroy();
    }
    highlightDisabled() {
        this.highlightReset();
        this.image.setTint(layout.colors.fadedTint);
    }
    highlightSelectable() {
        this.highlightReset();
        this.imageHighlight.setVisible(true).setTint(layout.colors.neutral);
    }
    highlightSelected() {
        this.highlightReset();
        this.imageHighlight.setVisible(true).setTint(layout.colors.secondary);
    }
    highlightReset() {
        this.imageHighlight.setVisible(false);
        this.image.setTint(layout.colors.neutral);
    }
    enableMouseover(scene: Game) {
        this.image
            .on('pointerover', () => scene.obj.maxCard.show(this.cardId))
            .on('pointerout', () => scene.obj.maxCard.hide());
    }
    protected tween(scene: Game, x: number, y: number, angle: number, scale?: number) {
        this.animation = scene.tweens.add({
            targets: [ this.image, this.imageHighlight, this.imageMask ],
            duration: animationConfig.duration.draw,
            x: x,
            y: y,
            angle: angle,
            scale: scale ? scale : this.image.scale
        });
    }
}