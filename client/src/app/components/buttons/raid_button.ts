import Game from '../../scenes/game';
import { layoutConfig } from '../../config/layout';
import { BattleType } from '../../../../../server/src/shared/config/enums';
import { BaseButton } from './base_button';

export default class RaidButton extends BaseButton {
  private gameScene: Game;

  constructor(scene: Game) {
    super(
      scene,
      layoutConfig.game.ui.raidButton.x,
      layoutConfig.game.ui.raidButton.y,
      'icon_military',
      'Überfall'
    );
    this.gameScene = scene;
    this.updateVisibility();
  }

  updateVisibility() {
    if (this.canShowActionButtons()) {
      this.show();
    } else {
      this.hide();
    }
  }

  protected onClickAction() {
    this.gameScene.resetView(
      this.gameScene.plannedBattle.type == BattleType.Raid ? BattleType.None : BattleType.Raid
    );
  }
}
