import Game from '../../scenes/game';
import { layoutConfig } from '../../config/layout';
import { designConfig } from 'src/app/config/design';
import { BattleType, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { ClientPlannedBattleHelper } from '../../../../../server/src/shared/interfaces/client_planned_battle';

export default class MissionButton {
  private scene: Game;
  private text!: Phaser.GameObjects.Text;
  private isVisible: boolean = false;

  constructor(scene: Game) {
    this.scene = scene;

    // Create button text
    this.text = scene.add
      .text(layoutConfig.game.ui.missionButton.x, layoutConfig.game.ui.missionButton.y, 'Mission durchführen')
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('left')
      .setOrigin(0, 0.5)
      .setInteractive({
        useHandCursor: true
      });

    // Add event listeners
    this.text
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.onClickAction();
      })
      .on('pointerover', () => this.text.setColor(designConfig.color.warn))
      .on('pointerout', () => this.text.setColor(designConfig.color.neutral));

    this.updateVisibility();
  }

  show() {
    this.isVisible = true;
    this.text.setVisible(true);
  }

  hide() {
    this.isVisible = false;
    this.text.setVisible(false);
  }

  updateVisibility() {
    // Only show button when it would have an effect
    const canShow =
      this.scene.state &&
      this.scene.state.playerPendingAction &&
      this.scene.state.playerIsActive &&
      this.scene.state.turnPhase === TurnPhase.Build &&
      !this.scene.activeCards.hand;

    if (canShow) {
      this.show();
    } else {
      this.hide();
    }
  }

  private onClickAction() {
    if (
      this.scene.state &&
      this.scene.state.playerPendingAction &&
      this.scene.state.playerIsActive &&
      this.scene.state.turnPhase == TurnPhase.Build &&
      !this.scene.activeCards.hand
    ) {
      if (ClientPlannedBattleHelper.cardLimitReached(this.scene.plannedBattle)) {
        this.scene.resetView(BattleType.None);
      } else {
        if (this.scene.plannedBattle.type != BattleType.Mission) {
          this.scene.resetView(BattleType.Mission);
        }
        if (!ClientPlannedBattleHelper.cardLimitReached(this.scene.plannedBattle)) {
          this.scene.plannedBattle.downsideCardsNum++;
          this.scene.updateView();
        }
      }
    }
  }
}
