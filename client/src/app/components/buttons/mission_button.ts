import Game from '../../scenes/game';
import { layoutConfig } from '../../config/layout';
import { BattleType } from '../../../../../server/src/shared/config/enums';
import { BaseButton } from './base_button';

export default class MissionButton extends BaseButton {
  private gameScene: Game;

  constructor(scene: Game) {
    super(
      scene,
      layoutConfig.game.ui.missionButton.x,
      layoutConfig.game.ui.missionButton.y,
      'icon_intelligence',
      'Mission'
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
      this.gameScene.plannedBattle.type == BattleType.Mission ? BattleType.None : BattleType.Mission
    );
  }
}
