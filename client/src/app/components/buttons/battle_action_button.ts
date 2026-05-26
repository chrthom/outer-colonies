import Game from '../../scenes/game';
import { designConfig } from '../../config/design';
import { BattleType } from '../../../../../server/src/shared/config/enums';
import { BaseButton } from './base_button';

export abstract class BattleActionButton extends BaseButton {
  private gameScene: Game;
  private battleType: BattleType;

  constructor(
    scene: Game,
    battleType: BattleType,
    layout: { x: number; y: number },
    iconKey: string,
    label: string
  ) {
    super(scene, layout.x, layout.y, iconKey, label);
    this.gameScene = scene;
    this.battleType = battleType;
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
    const isActive = this.gameScene.plannedBattle.type == this.battleType;

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
      this.gameScene.plannedBattle.type == this.battleType ? BattleType.None : this.battleType
    );
  }
}
