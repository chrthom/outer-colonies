import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { rules } from '@shared/config/rules';

export default class CombatRangeIndicator {
  private scene: Game;
  private images: Phaser.GameObjects.Image[];
  constructor(scene: Game) {
    this.scene = scene;
    this.images = Array.from({ length: rules.maxRange }, (_, i) =>
      this.scene.add
        .image(layoutConfig.game.ui.combatRange.x, layoutConfig.game.ui.combatRange.y, `range_${i + 1}`)
        .setOrigin(0.5)
        .setVisible(false)
    );
  }
  update() {
    this.hide();
    const range = this.scene.interaction.getVisibleCombatRange();
    if (range !== undefined) {
      this.show(range);
    }
  }
  show(range: number) {
    this.images[range - 1]?.setVisible(true);
  }
  hide() {
    this.images.forEach(i => i.setVisible(false));
  }
}
