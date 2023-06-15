import { animationConfig } from "../../config/animation";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";

export default class CardImage {
    sprite!: Phaser.GameObjects.Image;
    glowSprite!: Phaser.GameObjects.Image;
    cardId!: number;
    animation?: Phaser.Tweens.Tween;
    constructor(scene: Game, x: number, y: number, cardId: number, opponentCard?: boolean, scale?: number) {
        this.cardId = cardId;
        this.glowSprite = scene.add
            .image(x, y, 'card_glow')
            //.setCrop(41, 41, 740, 1040)
            .setOrigin(0.5, 1)
            .setAngle(opponentCard ? 180 : 0)
            .setScale(scale ? scale : layout.cards.scale.normal)
            .setVisible(false);
        this.sprite = scene.add
            .image(x, y, `card_${cardId}`)
            .setCrop(41, 41, 740, 1040)
            .setOrigin(0.5, 1)
            .setAngle(opponentCard ? 180 : 0)
            .setScale(scale ? scale : layout.cards.scale.normal)
            .setInteractive();
    }
    destroy() {
        this.sprite.destroy();
        this.glowSprite.destroy();
    }
    highlightDisabled() {
        this.highlightReset();
        this.sprite.setTint(layout.colors.fadedTint);
    }
    highlightSelectable() {
        this.highlightReset();
        this.glowSprite.setVisible(true).setTint(layout.colors.neutral);
    }
    highlightSelected() {
        this.highlightReset();
        this.glowSprite.setVisible(true).setTint(layout.colors.secondary);
    }
    highlightReset() {
        this.glowSprite.setVisible(false);
        this.sprite.setTint(layout.colors.neutral);
    }
    enableMouseover(scene: Game) {
        this.sprite
            .on('pointerover', () => scene.obj.maxCard.show(this.cardId))
            .on('pointerout', () => scene.obj.maxCard.hide());
    }
    protected tween(scene: Game, x: number, y: number, angle: number, scale?: number) {
        this.animation = scene.tweens.add({
            targets: [ this.sprite, this.glowSprite ],
            duration: animationConfig.duration.draw,
            x: x,
            y: y,
            angle: angle,
            scale: scale ? scale : this.sprite.scale
        });
    }
}