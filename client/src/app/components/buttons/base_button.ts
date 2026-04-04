import { layoutConfig } from '../../config/layout';
import { designConfig } from 'src/app/config/design';
import Game from '../../scenes/game';
import Matchmaking from '../../scenes/matchmaking';

export abstract class BaseButton {
  protected scene: Game | Matchmaking;
  protected text!: Phaser.GameObjects.Text;
  protected image!: Phaser.GameObjects.Image;
  protected isVisible: boolean = false;
  protected xTextOffset: number;
  protected yTextOffset: number;

  constructor(
    scene: Game | Matchmaking,
    x: number,
    y: number,
    iconKey: string,
    initialText: string,
    xTextOffset: number = layoutConfig.game.ui.exitButton.xTextOffset,
    yTextOffset: number = layoutConfig.game.ui.exitButton.yTextOffset
  ) {
    this.scene = scene;
    this.xTextOffset = xTextOffset;
    this.yTextOffset = yTextOffset;

    // Create button icon
    this.image = scene.add
      .image(x, y, iconKey)
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true
      });

    // Create button text
    this.text = scene.add
      .text(x + xTextOffset, y + yTextOffset, initialText)
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('left')
      .setOrigin(0, 0.5)
      .setInteractive({
        useHandCursor: true
      });

    // Add event listeners
    this.setupEventListeners();
  }

  protected setupEventListeners() {
    [this.text, this.image].forEach(o =>
      o.on('pointerdown', (p: Phaser.Input.Pointer) => {
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
}