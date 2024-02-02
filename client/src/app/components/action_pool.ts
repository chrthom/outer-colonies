import { designConfig } from '../config/design';
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
          layoutConfig.ui.actionPool.x,
          layoutConfig.ui.actionPool.y + index * layoutConfig.ui.actionPool.yDistance,
          `icon_${action}`
        )
        .setOrigin(0.5, 0.5)
        .setTint(
          designConfig.colors.primary,
          designConfig.colors.neutral,
          designConfig.colors.primary,
          designConfig.colors.primary
        )
        .setAlpha(designConfig.colors.alpha)
    );
  }
}
