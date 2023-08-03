import { MsgTypeInbound } from '../../../../../server/src/components/config/enums';
import { animationConfig } from '../../config/animation';
import { layout } from '../../config/layout';
import Game from '../../scenes/game';

export default class RetractCardButton {
  image: Phaser.GameObjects.Image;
  private scene!: Game;
  constructor(
    scene: Game,
    cardX: number,
    cardY: number,
    cardStackUUID: string,
    cardIndex: number,
    crititcal: boolean
  ) {
    this.scene = scene;
    this.image = scene.add
      .image(
        cardX + layout.cards.retractCardButton.xOffset,
        cardY + layout.cards.retractCardButton.yOffset,
        `icon_retract_card`
      )
      .setOrigin(0.5, 0.5)
      .setAlpha(layout.colors.alpha)
      .setDepth(layout.depth.indicators)
      .setInteractive()
      .on('pointerover', () => this.setTintHover())
      .on('pointerout', () => (crititcal ? this.setTintCritical() : this.setTintNormal()))
      .on('pointerdown', () => scene.socket.emit(MsgTypeInbound.Retract, cardStackUUID, cardIndex));
    crititcal ? this.setTintCritical() : this.setTintNormal();
  }
  destroy() {
    this.image.destroy();
  }
  setTintNormal() {
    this.image.setTint(
      layout.colors.primary,
      layout.colors.neutral,
      layout.colors.primary,
      layout.colors.primary
    );
  }
  setTintCritical() {
    this.image.setTint(
      layout.colors.secondary,
      layout.colors.neutral,
      layout.colors.secondary,
      layout.colors.secondary
    );
  }
  setTintHover() {
    this.image.setTint(layout.colors.neutral);
  }
  tween(cardX: number, cardY: number) {
    this.scene.tweens.add({
      targets: this.image,
      duration: animationConfig.duration.move,
      x: cardX + layout.cards.retractCardButton.xOffset,
      y: cardY + layout.cards.retractCardButton.yOffset
    });
  }
}
