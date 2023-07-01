import { animationConfig } from "../../config/animation";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";

export default class ValueIndicator {
    shape!: Phaser.GameObjects.Shape;
    text!: Phaser.GameObjects.Text;
    private scene!: Game;
    private ownedByPlayer!: boolean;
    constructor(
        scene: Game,
        value: string,
        critical: boolean,
        cardX: number,
        cardY: number,
        ownedByPlayer: boolean,
        hasEllipseShape: boolean
    ) {
        this.scene = scene;
        this.ownedByPlayer = ownedByPlayer;
        if (hasEllipseShape) {
            this.shape = scene.add
                .ellipse(
                    this.x(cardX),
                    this.y(cardY),
                    64,
                    32,
                    critical ? layout.colors.secondary : layout.colors.primary,
                    layout.colors.alpha
                )
                .setOrigin(0.5, 0.5);
        } else {
            this.shape = scene.add
                .star(
                    this.x(cardX),
                    this.y(cardY),
                    12,
                    16,
                    22,
                    critical ? layout.colors.secondary : layout.colors.primary,
                    layout.colors.alpha
                )
                .setOrigin(0.5, 0.5);
        }
        this.text = scene.add
            .text(this.x(cardX), this.y(cardY), value)
            .setFontSize(layout.cards.damageIndicator.fontSize)
            .setFontFamily(layout.font.captionFamily)
            .setColor('#eeeecc')
            .setAlign('center')
            .setOrigin(0.5, 0.5);
    }
    destroy() {
        this.shape.destroy();
        this.text.destroy();
    }
    tween(cardX: number, cardY: number) {
        this.scene.tweens.add({
            targets: [ this.text, this.shape ],
            duration: animationConfig.duration.move,
            x: this.x(cardX),
            y: this.y(cardY)
        });
    }
    private x(cardX: number) {
        return cardX + layout.cards.damageIndicator.xOffset;
    }
    private y(cardY: number) {
        return cardY + (this.ownedByPlayer ? layout.cards.damageIndicator.yOffsetPlayer : layout.cards.damageIndicator.yOffsetOpponent);
    }
}