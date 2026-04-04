import Game from '../../scenes/game';
import { layoutConfig } from '../../config/layout';
import { BattleType, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { ClientPlannedBattleHelper } from '../../../../../server/src/shared/interfaces/client_planned_battle';
import { BaseButton } from './base_button';

export default class MissionButton extends BaseButton {
  private gameScene: Game;

  constructor(scene: Game) {
    super(
      scene,
      layoutConfig.game.ui.missionButton.x,
      layoutConfig.game.ui.missionButton.y,
      'icon_intelligence',
      'Mission durchführen'
    );
    this.gameScene = scene;
    this.updateVisibility();
  }

  updateVisibility() {
    // Only show button when it would have an effect
    const canShow =
      this.gameScene.state &&
      this.gameScene.state.playerPendingAction &&
      this.gameScene.state.playerIsActive &&
      this.gameScene.state.turnPhase === TurnPhase.Build &&
      !this.gameScene.activeCards.hand;

    if (canShow) {
      this.show();
    } else {
      this.hide();
    }
  }

  protected onClickAction() {
    if (
      this.gameScene.state &&
      this.gameScene.state.playerPendingAction &&
      this.gameScene.state.playerIsActive &&
      this.gameScene.state.turnPhase == TurnPhase.Build &&
      !this.gameScene.activeCards.hand
    ) {
      if (ClientPlannedBattleHelper.cardLimitReached(this.gameScene.plannedBattle)) {
        this.gameScene.resetView(BattleType.None);
      } else {
        if (this.gameScene.plannedBattle.type != BattleType.Mission) {
          this.gameScene.resetView(BattleType.Mission);
        }
        if (!ClientPlannedBattleHelper.cardLimitReached(this.gameScene.plannedBattle)) {
          this.gameScene.plannedBattle.downsideCardsNum++;
          this.gameScene.updateView();
        }
      }
    }
  }
}
