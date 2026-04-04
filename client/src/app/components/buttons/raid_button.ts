import Game from '../../scenes/game';
import { layoutConfig } from '../../config/layout';
import { designConfig } from '../../config/design';
import { BattleType } from '../../../../../server/src/shared/config/enums';
import { BaseButton } from './base_button';

export default class RaidButton extends BaseButton {
  private gameScene: Game;

  constructor(scene: Game) {
    super(scene, layoutConfig.game.ui.raidButton.x, layoutConfig.game.ui.raidButton.y, 'exit', 'Überfall');
    this.gameScene = scene;
    this.updateVisibility();
  }

  updateVisibility() {
    if (this.canShowActionButtons()) {
      this.show();
      this.updateColor();
    } else {
      this.hide();
    }
  }

  private updateColor() {
    const isActive = this.gameScene.plannedBattle.type == BattleType.Raid;

    // Update icon tint
    const tintColor = isActive ? designConfig.tint.player : designConfig.tint.neutral;
    this.image.setTint(tintColor, tintColor, tintColor, tintColor);

    // Update text color
    const textColor = isActive ? designConfig.color.player : designConfig.color.neutral;
    this.text.setColor(textColor);
  }

  protected override setupEventListeners() {
    [this.text, this.image].forEach(o =>
      o
        .on('pointerdown', (p: Phaser.Input.Pointer) => {
          if (p.leftButtonDown()) this.onClickAction();
        })
        .on('pointerover', () => this.text.setColor(designConfig.color.warn))
        .on('pointerout', () => this.updateColor())
    );
  }

  protected onClickAction() {
    this.gameScene.resetView(
      this.gameScene.plannedBattle.type == BattleType.Raid ? BattleType.None : BattleType.Raid
    );
  }
}
