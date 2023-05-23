import Layout from "../config/layout";
import Game from "../scenes/game";

const layout = new Layout();

export default class ActionPool {
    sprites: Phaser.GameObjects.Image[] = [];
    constructor(scene: Game) {}
    destroy() {
        this.sprites.forEach(s => s.destroy());
    }
    update(scene: Game) {
        this.destroy();
        this.sprites = scene.state.actionPool.map((action, index) => {
            console.log(`icon_${action}`); //////
            return scene.add
                .image(
                    layout.actionPool.x,
                    layout.actionPool.y + index * layout.actionPool.yDistance,
                    `icon_${action}`
                ).setOrigin(0.5, 0.5)
                .setTint(layout.colors.primary)
                .setAlpha(layout.colors.alpha);
        });
    }
}