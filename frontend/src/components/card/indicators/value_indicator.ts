import { layout } from "../../../config/layout";
import Game from "../../../scenes/game";

export default class ValueIndicator {
    shape: Phaser.GameObjects.Shape;
    text: Phaser.GameObjects.Text;
    constructor(
        scene: Game,
        value: string,
        critical: boolean,
        cardX: number,
        cardY: number,
        ownedByPlayer: boolean,
        hasEllipseShape: boolean
    ) {
        const x = cardX + layout.cards.damageIndicator.xOffset;
        const y = cardY + (ownedByPlayer ? layout.cards.damageIndicator.yOffsetPlayer : layout.cards.damageIndicator.yOffsetOpponent);
        if (hasEllipseShape) {
            this.shape = scene.add
                .ellipse(
                    x,
                    y,
                    64,
                    32,
                    critical ? layout.colors.secondary : layout.colors.primary,
                    layout.colors.alpha
                )
                .setOrigin(0.5, 0.5);
        } else {
            this.shape = scene.add
                .star(
                    x,
                    y,
                    12,
                    16,
                    22,
                    critical ? layout.colors.secondary : layout.colors.primary,
                    layout.colors.alpha
                )
                .setOrigin(0.5, 0.5);
        }
        this.text = scene.add
            .text(x, y, value)
            .setFontSize(layout.cards.damageIndicator.fontSize)
            .setFontFamily('Impact')
            .setColor('#eeeecc')
            .setAlign('center')
            .setOrigin(0.5, 0.5);
    }
    destroy() {
        this.shape.destroy();
        this.text.destroy();
    }

}