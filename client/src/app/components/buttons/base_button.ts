import { layoutConfig } from '../../config/layout';
import { designConfig } from 'src/app/config/design';
import { TurnPhase } from '@shared/config/enums';
import Game from '../../scenes/game';
import Matchmaking from '../../scenes/matchmaking';

export abstract class BaseButton {
  protected scene: Game | Matchmaking;
  protected text!: Phaser.GameObjects.Text;
  protected image!: Phaser.GameObjects.Image;
  protected isVisible: boolean = false;

  constructor(scene: Game | Matchmaking, x: number, y: number, iconKey: string, initialText: string) {
    this.scene = scene;

    this.image = scene.add
      .image(x, y, 'icon_' + iconKey)
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true
      });

    this.text = scene.add
      .text(
        x + layoutConfig.game.ui.baseButtons.xTextOffset,
        y + layoutConfig.game.ui.baseButtons.yTextOffset,
        initialText
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('right')
      .setOrigin(1, 0.5)
      .setInteractive({
        useHandCursor: true
      });

    this.setupEventListeners();
  }

  protected setupEventListeners() {
    [this.text, this.image].forEach(o =>
      o
        .on('pointerdown', (p: Phaser.Input.Pointer) => {
          if (p.leftButtonDown()) this.onClickAction();
        })
        .on('pointerover', () => this.text.setColor(designConfig.color.warn))
        .on('pointerout', () => this.text.setColor(designConfig.color.neutral))
    );
  }

  show() {
    this.isVisible = true;
    this.text.setVisible(true);
    this.image.setVisible(true);
  }

  hide() {
    this.isVisible = false;
    this.text.setVisible(false);
    this.image.setVisible(false);
  }

  updateText(newText: string) {
    this.text.setText(newText);
  }

  protected abstract onClickAction(): void;

  /**
   * Check if action buttons (mission/raid) should be shown
   * Only applicable for Game scenes, returns false for Matchmaking scenes
   */
  protected canShowActionButtons(): boolean {
    if (!(this.scene instanceof Game)) return false;

    const gameScene = this.scene as Game;
    return (
      gameScene.state.playerPendingAction &&
      gameScene.state.playerIsActive &&
      gameScene.state.turnPhase === TurnPhase.Build &&
      !gameScene.activeCards.hand &&
      gameScene.cardStacks.some(stack => stack.ownedByPlayer && stack.data.missionReady)
    );
  }
}
