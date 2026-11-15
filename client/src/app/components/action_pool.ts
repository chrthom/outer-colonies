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
  update() {
    const placementConfig = this.ownedByPlayer
      ? layoutConfig.game.ui.actionPool.player
      : layoutConfig.game.ui.actionPool.opponent;
    const color = this.ownedByPlayer ? designConfig.tint.player : designConfig.tint.opponent;
    const actions = this.scene.getPlayerState(this.ownedByPlayer).actionPool;
    actions.forEach((action, index) => {
      if (index < this.images.length) {
        this.images[index].setTexture(`icon_${action}`);
      } else {
        this.images.push(
          this.scene.add
            .image(placementConfig.x, placementConfig.y + index * placementConfig.yDistance, `icon_${action}`)
            .setOrigin(0.5)
            .setTint(color, designConfig.tint.neutral, color, color)
            .setAlpha(designConfig.alpha.normal)
        );
      }
    });
    while (this.images.length > actions.length) {
      this.images.pop()?.destroy();
    }
  }
}
