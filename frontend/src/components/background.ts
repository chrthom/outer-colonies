import { layout } from "../config/layout";

export default class Background {
    image!: Phaser.GameObjects.Image;
    private scene!: Phaser.Scene;
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.image = scene.add.image(0, 0, 'background').setOrigin(0, 0).setAlpha(layout.colors.fadedAlpha);
    }
}