import { layout } from "../../config/layout";

export default class VersonIndicator {
    private scene!: Phaser.Scene;
    private text!: Phaser.GameObjects.Text;
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.text = scene.add.text(
            layout.version.x,
            layout.version.y,
            'Outer Colonies v1.0 - Mimas'
        )
            .setFontSize(layout.font.size)
            .setFontFamily(layout.font.textFamily)
            .setColor(layout.font.color)
            .setAlign('right')
            .setOrigin(1, 1);
    }
}