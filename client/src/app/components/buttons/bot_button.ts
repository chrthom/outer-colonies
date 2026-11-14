import { designConfig } from '../../config/design';
import { layoutConfig } from '../../config/layout';
import Matchmaking from '../../scenes/matchmaking';
import Phaser from 'phaser';

/**
 * Text button in the matchmaking scene which starts a singleplayer game
 * against the AI-controlled bot. The button has no icon asset, as the
 * matchmaking scene only preloads the exit icon.
 */
export default class BotButton {
  private scene: Matchmaking;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Matchmaking) {
    this.scene = scene;
    this.text = scene.add
      .text(layoutConfig.load.botButton.x, layoutConfig.load.botButton.y, 'Gegen Bot spielen')
      .setFontSize(layoutConfig.fontSize.large)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('center')
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true
      })
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.onClickAction();
      })
      .on('pointerover', () => this.text.setColor(designConfig.color.hover))
      .on('pointerout', () => this.text.setColor(designConfig.color.neutral));
  }

  private onClickAction() {
    this.scene.startBotGame();
  }
}
