import Game from '../../scenes/game';
import { layoutConfig } from '../../config/layout';
import { BattleType, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { BaseButton } from './base_button';

export default class RaidButton extends BaseButton {
  private gameScene: Game;

  constructor(scene: Game) {
    super(
      scene,
      layoutConfig.game.ui.raidButton.x,
      layoutConfig.game.ui.raidButton.y,
      'icon_military',
      'Kolonie angreifen'
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
    // Find opponent colony stack
    const opponentColony = this.gameScene.cardStacks.find(stack => stack.isOpponentColony);

    if (opponentColony) {
      this.gameScene.resetView(
        this.gameScene.plannedBattle.type == BattleType.Raid ? BattleType.None : BattleType.Raid
      );
    }
  }
}
