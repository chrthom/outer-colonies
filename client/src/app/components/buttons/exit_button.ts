import { environment } from '../../../environments/environment';
import { layout } from '../../config/layout';
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
    const self = this;
    this.text = scene.add
      .text(
        layout.exitButton.x + layout.exitButton.xTextOffset,
        layout.exitButton.y + layout.exitButton.yTextOffset,
        ['']
      )
      .setFontSize(layout.exitButton.fontSize)
      .setFontFamily(layout.font.captionFamily)
      .setColor(layout.font.color)
      .setAlign('right')
      .setOrigin(1, 0.5)
      .setInteractive();
    this.confirmText = scene.add
      .text(
        layout.exitButton.x + layout.exitButton.xTextOffset,
        layout.exitButton.y + layout.exitButton.yTextOffset + layout.exitButton.yConfirmOffset,
        ['Kapitulation bestätigen']
      )
      .setFontSize(layout.exitButton.fontSize)
      .setFontFamily(layout.font.captionFamily)
      .setColor(layout.font.color)
      .setAlign('right')
      .setOrigin(1, 0.5)
      .setInteractive();
    this.image = this.scene.add
      .image(layout.exitButton.x, layout.exitButton.y, 'icon_exit')
      .setOrigin(0.5, 0.5)
      .setInteractive();
    (<Phaser.GameObjects.GameObject[]>[this.text, this.image]).forEach(o =>
      o
        .on('pointerdown', () => {
          self.onClickAction();
        })
        .on('pointerover', () => {
          self.text.setColor(layout.font.colorWarn);
        })
        .on('pointerout', () => {
          self.text.setColor(layout.font.color);
        })
    );
    this.confirmText
      .on('pointerdown', () => {
        self.onClickAction(true);
      })
      .on('pointerover', () => {
        self.confirmText.setColor(layout.font.colorWarn);
      })
      .on('pointerout', () => {
        self.confirmText.setColor(layout.font.color);
      });
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
