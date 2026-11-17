import { InterventionType } from '@shared/config/enums';
import { rules } from '@shared/config/rules';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

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
    if (
      // The server encodes "no battle" as rules.maxRange + 1
      this.scene.state.battle.range < rules.maxRange + 1 &&
      this.scene.state.intervention?.rootType != InterventionType.BattleRoundEnd
    ) {
      this.show(this.scene.state.battle.range);
    }
  }
  show(range: number) {
    this.images[range - 1]?.setVisible(true);
  }
  hide() {
    this.images.forEach(i => i.setVisible(false));
  }
}
