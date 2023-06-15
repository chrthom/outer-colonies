import { layout } from "../config/layout";
import Game from "../scenes/game";

export default class ActionPool {
    sprites: Phaser.GameObjects.Image[] = [];
    private scene!: Game;
    constructor(scene: Game) {
        this.scene = scene;
    }
    destroy() {
        this.sprites.forEach(s => s.destroy());
    }
    update() {
        this.destroy();
        this.sprites = this.scene.state.actionPool.map((action, index) => this.scene.add
            .image(
                layout.actionPool.x,
                layout.actionPool.y + index * layout.actionPool.yDistance,
                `icon_${action}`
            ).setOrigin(0.5, 0.5)
            .setTint(layout.colors.primary, layout.colors.neutral, layout.colors.primary, layout.colors.primary)
            .setAlpha(layout.colors.alpha)
        );
    }
}