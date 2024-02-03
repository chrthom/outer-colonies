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
          layoutConfig.game.fixed.actionPool.x,
          layoutConfig.game.fixed.actionPool.y + index * layoutConfig.game.fixed.actionPool.yDistance,
          `icon_${action}`
        )
        .setOrigin(0.5, 0.5)
        .setTint(
          designConfig.tint.primary,
          designConfig.tint.neutral,
          designConfig.tint.primary,
          designConfig.tint.primary
        )
        .setAlpha(designConfig.alpha.normal)
    );
  }
}
