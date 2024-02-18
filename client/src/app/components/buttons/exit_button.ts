import Matchmaking from 'src/app/scenes/matchmaking';
import { environment } from '../../../environments/environment';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { designConfig } from 'src/app/config/design';

export default class ExitButton {
  private isMatchmaking!: boolean;
  private scene!: Matchmaking | Game;
  private image!: Phaser.GameObjects.Image;
  private text!: Phaser.GameObjects.Text;
  private confirmText!: Phaser.GameObjects.Text;
  constructor(scene: Matchmaking | Game) {
    this.scene = scene;
    this.isMatchmaking = !(scene instanceof Game);
    this.text = scene.add
      .text(
        layoutConfig.game.ui.exitButton.x + layoutConfig.game.ui.exitButton.xTextOffset,
        layoutConfig.game.ui.exitButton.y + layoutConfig.game.ui.exitButton.yTextOffset,
        ''
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('right')
      .setOrigin(1, 0.5)
      .setInteractive({
        useHandCursor: true
      });
    this.confirmText = scene.add
      .text(
        layoutConfig.game.ui.exitButton.x + layoutConfig.game.ui.exitButton.xTextOffset,
        layoutConfig.game.ui.exitButton.y +
          layoutConfig.game.ui.exitButton.yTextOffset +
          layoutConfig.game.ui.exitButton.yConfirmOffset,
        'Kapitulation bestätigen'
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('right')
      .setOrigin(1, 0.5)
      .setInteractive({
        useHandCursor: true
      });
    this.image = this.scene.add
      .image(layoutConfig.game.ui.exitButton.x, layoutConfig.game.ui.exitButton.y, 'icon_exit')
      .setOrigin(0.5, 0.5)
      .setInteractive({
        useHandCursor: true
      });
    (<Phaser.GameObjects.GameObject[]>[this.text, this.image]).forEach(
      o =>
        o
          .on('pointerdown', () => {
            this.onClickAction();
          })
          .on('pointerover', () => {
            this.text.setColor(designConfig.color.warn);
          })
          .on('pointerout', () => {
            this.text.setColor(designConfig.color.neutral);
          }),
      this
    );
    this.confirmText
      .on('pointerdown', () => {
        this.onClickAction(true);
      })
      .on('pointerover', () => {
        this.confirmText.setColor(designConfig.color.warn);
      })
      .on(
        'pointerout',
        () => {
          this.confirmText.setColor(designConfig.color.neutral);
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
      this.scene.socket.disconnect();
      window.location.href = environment.urls.website;
    } else {
      this.confirmText.setVisible(!this.confirmText.visible);
    }
  }
}
