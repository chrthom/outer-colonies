import Layout from "../../../config/layout";
import Game from "../../../scenes/game";

const layout = new Layout();

export default class DamageIndicator {
    shape: Phaser.GameObjects.Star;
    text: Phaser.GameObjects.Text;
    constructor(scene: Game, damage: number, critical: boolean, cardX: number, cardY: number) {
        const x = cardX;
        const y = cardY;
        this.shape = scene.add.star(x, y, 12, 16, 22, critical ? layout.colors.secondary : layout.colors.primary, 0.8)
            .setOrigin(0.5, 0.5);
        this.text = scene.add.text(x, y, String(damage))
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