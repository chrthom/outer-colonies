import { layoutConfig } from '../config/layout';
import Game from '../scenes/game';

export default class ActionPool {
  images: Phaser.GameObjects.Image[] = [];
  private scene!: Game;
  constructor(scene: Game) {
    this.scene = scene;
  }
  destroy() {
    this.images.forEach(s => s.destroy());
  }
  update() {
    this.destroy();
    this.images = this.scene.state.actionPool.map((action, index) =>
      this.scene.add
        .image(
          layoutConfig.actionPool.x,
          layoutConfig.actionPool.y + index * layoutConfig.actionPool.yDistance,
          `icon_${action}`
        )
        .setOrigin(0.5, 0.5)
        .setTint(
          layoutConfig.colors.primary,
          layoutConfig.colors.neutral,
          layoutConfig.colors.primary,
          layoutConfig.colors.primary
        )
        .setAlpha(layoutConfig.colors.alpha)
    );
  }
}
