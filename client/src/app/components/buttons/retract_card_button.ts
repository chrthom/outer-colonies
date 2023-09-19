import { MsgTypeInbound } from '../../../../../server/src/components/config/enums';
import { animationConfig } from '../../config/animation';
import { layoutConfig } from '../../config/layout';
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
        cardX + layoutConfig.cards.retractCardButton.xOffset,
        cardY + layoutConfig.cards.retractCardButton.yOffset,
        'icon_retract_card'
      )
      .setOrigin(0.5, 0.5)
      .setAlpha(layoutConfig.colors.alpha)
      .setDepth(layoutConfig.depth.indicators)
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
      layoutConfig.colors.primary,
      layoutConfig.colors.neutral,
      layoutConfig.colors.primary,
      layoutConfig.colors.primary
    );
  }
  setTintCritical() {
    this.image.setTint(
      layoutConfig.colors.secondary,
      layoutConfig.colors.neutral,
      layoutConfig.colors.secondary,
      layoutConfig.colors.secondary
    );
  }
  setTintHover() {
    this.image.setTint(layoutConfig.colors.neutral);
  }
  tween(cardX: number, cardY: number) {
    this.scene.tweens.add({
      targets: this.image,
      duration: animationConfig.duration.move,
      x: cardX + layoutConfig.cards.retractCardButton.xOffset,
      y: cardY + layoutConfig.cards.retractCardButton.yOffset
    });
  }
}
