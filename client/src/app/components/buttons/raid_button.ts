import Game from '../../scenes/game';
import { layoutConfig } from '../../config/layout';
import { designConfig } from 'src/app/config/design';
import { BattleType, TurnPhase } from '../../../../../server/src/shared/config/enums';

export default class RaidButton {
  private scene: Game;
  private text!: Phaser.GameObjects.Text;
  private isVisible: boolean = false;

  constructor(scene: Game) {
    this.scene = scene;

    // Create button text
    this.text = scene.add
      .text(layoutConfig.game.ui.raidButton.x, layoutConfig.game.ui.raidButton.y, 'Kolonie angreifen')
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
    // Find opponent colony stack
    const opponentColony = this.scene.cardStacks.find(stack => stack.isOpponentColony);

    if (opponentColony) {
      this.scene.resetView(
        this.scene.plannedBattle.type == BattleType.Raid ? BattleType.None : BattleType.Raid
      );
    }
  }
}
// Test comment
// Another test comment
