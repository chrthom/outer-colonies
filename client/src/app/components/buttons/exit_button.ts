import { environment } from '../../../environments/environment';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export default class ExitButton {
  private isMatchmaking!: boolean;
  private scene!: Phaser.Scene | Game;
  private image!: Phaser.GameObjects.Image;
  private text!: Phaser.GameObjects.Text;
  private confirmText!: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene | Game) {
    this.scene = scene;
    this.isMatchmaking = !(scene instanceof Game);
    this.text = scene.add
      .text(
        layoutConfig.exitButton.x + layoutConfig.exitButton.xTextOffset,
        layoutConfig.exitButton.y + layoutConfig.exitButton.yTextOffset,
        ['']
      )
      .setFontSize(layoutConfig.exitButton.fontSize)
      .setFontFamily(layoutConfig.font.captionFamily)
      .setColor(layoutConfig.font.color)
      .setAlign('right')
      .setOrigin(1, 0.5)
      .setInteractive();
    this.confirmText = scene.add
      .text(
        layoutConfig.exitButton.x + layoutConfig.exitButton.xTextOffset,
        layoutConfig.exitButton.y +
          layoutConfig.exitButton.yTextOffset +
          layoutConfig.exitButton.yConfirmOffset,
        ['Kapitulation bestätigen']
      )
      .setFontSize(layoutConfig.exitButton.fontSize)
      .setFontFamily(layoutConfig.font.captionFamily)
      .setColor(layoutConfig.font.color)
      .setAlign('right')
      .setOrigin(1, 0.5)
      .setInteractive();
    this.image = this.scene.add
      .image(layoutConfig.exitButton.x, layoutConfig.exitButton.y, 'icon_exit')
      .setOrigin(0.5, 0.5)
      .setInteractive();
    (<Phaser.GameObjects.GameObject[]>[this.text, this.image]).forEach(
      o =>
        o
          .on('pointerdown', () => {
            this.onClickAction();
          })
          .on('pointerover', () => {
            this.text.setColor(layoutConfig.font.colorWarn);
          })
          .on('pointerout', () => {
            this.text.setColor(layoutConfig.font.color);
          }),
      this
    );
    this.confirmText
      .on('pointerdown', () => {
        this.onClickAction(true);
      })
      .on('pointerover', () => {
        this.confirmText.setColor(layoutConfig.font.colorWarn);
      })
      .on(
        'pointerout',
        () => {
          this.confirmText.setColor(layoutConfig.font.color);
        },
        this
      );
    this.update();
  }
  update() {
    this.confirmText.setVisible(false);
    if (this.isMatchmaking) this.text.setText('Spielersuche abbrechen');
    else if (this.scene instanceof Game && !this.scene.state?.gameResult) this.text.setText('Aufgeben');
    else this.text.setText('Spiel beenden');
  }
  private onClickAction(confirmed?: boolean) {
    if (this.isMatchmaking || confirmed || (this.scene instanceof Game && this.scene.state.gameResult)) {
      window.location.href = environment.urls.website;
    } else {
      this.confirmText.setVisible(!this.confirmText.visible);
    }
  }
}
