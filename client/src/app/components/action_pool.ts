import { designConfig } from '../config/design';
import { layoutConfig } from '../config/layout';
import Game from '../scenes/game';

export default class ActionPool {
  images: Phaser.GameObjects.Image[] = [];
  private scene: Game;
  private ownedByPlayer: boolean;
  constructor(scene: Game, ownedByPlayer: boolean) {
    this.scene = scene;
    this.ownedByPlayer = ownedByPlayer;
  }
  destroy() {
    this.images.forEach(s => s.destroy());
  }
  update() {
    this.destroy();
    const placementConfig = this.ownedByPlayer
      ? layoutConfig.game.ui.actionPool.player
      : layoutConfig.game.ui.actionPool.opponent;
    const color = this.ownedByPlayer ? designConfig.tint.player : designConfig.tint.opponent;
    this.images = this.scene.getPlayerState(this.ownedByPlayer).actionPool.map((action, index) =>
      this.scene.add
        .image(placementConfig.x, placementConfig.y + index * placementConfig.yDistance, `icon_${action}`)
        .setOrigin(0.5)
        .setTint(color, designConfig.tint.neutral, color, color)
        .setAlpha(designConfig.alpha.normal)
    );
  }
}
