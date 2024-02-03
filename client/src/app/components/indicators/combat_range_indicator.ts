import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export default class CombatRangeIndicator {
  private scene!: Game;
  private images!: Phaser.GameObjects.Image[];
  constructor(scene: Game) {
    this.scene = scene;
    this.images = [1, 2, 3, 4].map(i =>
      this.scene.add
        .image(layoutConfig.game.ui.combatRange.x, layoutConfig.game.ui.combatRange.y, `range_${i}`)
        .setOrigin(0.5, 0.5)
        .setVisible(false)
    );
  }
  update() {
    this.hide();
    if (this.scene.state.battle?.range < 5) this.show(this.scene.state.battle.range);
  }
  show(range: number) {
    this.images[range - 1].setVisible(true);
  }
  hide() {
    this.images.forEach(i => i.setVisible(false));
  }
}
