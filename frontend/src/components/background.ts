import { layout } from "../config/layout";
import Game from "../scenes/game";

export default class Background {
    image!: Phaser.GameObjects.Image;
    private scene!: Game;
    constructor(scene: Game) {
        this.scene = scene;
        this.image = scene.add.image(0, 0, `background`).setOrigin(0, 0).setAlpha(layout.colors.fadedAlpha);
    }
}