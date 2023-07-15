import { layout } from "../../config/layout";

export default class VersonIndicator {
    constructor(scene: Phaser.Scene) {
        scene.add.text(
            layout.version.x,
            layout.version.y,
            'Outer Colonies v1.2 - Dione'
        )
            .setFontSize(layout.font.size)
            .setFontFamily(layout.font.textFamily)
            .setColor(layout.font.color)
            .setAlign('right')
            .setOrigin(1, 1);
    }
}