import Matchmaking from 'src/app/scenes/matchmaking';
import { environment } from '../../../environments/environment';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { designConfig } from 'src/app/config/design';
import { MsgTypeInbound } from '@shared/config/enums';
import { BaseButton } from './base_button';
import SocketService from '../../socket_service';

export default class ExitButton extends BaseButton {
  private isMatchmaking!: boolean;
  private confirmText!: Phaser.GameObjects.Text;

  constructor(scene: Matchmaking | Game) {
    super(scene, layoutConfig.game.ui.exitButton.x, layoutConfig.game.ui.exitButton.y, 'exit', '');
    this.isMatchmaking = !(scene instanceof Game);

    this.confirmText = scene.add
      .text(
        layoutConfig.game.ui.exitButton.x + layoutConfig.game.ui.baseButtons.xTextOffset,
        layoutConfig.game.ui.exitButton.y +
          layoutConfig.game.ui.baseButtons.yTextOffset +
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

    this.confirmText
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.onClickAction(true);
      })
      .on('pointerover', () => this.confirmText.setColor(designConfig.color.warn))
      .on('pointerout', () => this.confirmText.setColor(designConfig.color.neutral));

    this.update();
  }

  override show() {
    super.show();
  }

  override hide() {
    super.hide();
    this.confirmText.setVisible(false);
  }

  update() {
    this.confirmText.setVisible(false);
    if (this.isMatchmaking)
      // After a matchmaking timeout the search already ended, so the button
      // only offers leaving back to the website
      this.updateText(
        this.scene instanceof Matchmaking && this.scene.searchEnded
          ? 'Zurück zur Website'
          : 'Spielersuche abbrechen'
      );
    else if (this.scene instanceof Game && !this.scene.state.gameResult && !this.scene.connectionLost)
      this.updateText('Aufgeben');
    else this.updateText('Spiel beenden');
  }

  protected onClickAction(confirmed?: boolean) {
    if (
      this.isMatchmaking ||
      (this.scene instanceof Game && (this.scene.state.gameResult || this.scene.connectionLost))
    ) {
      SocketService.disconnect();
      window.location.href = environment.urls.website;
    } else if (confirmed) {
      this.scene.socket.emit(MsgTypeInbound.Surrender);
    } else {
      this.confirmText.setVisible(!this.confirmText.visible);
    }
  }
}
