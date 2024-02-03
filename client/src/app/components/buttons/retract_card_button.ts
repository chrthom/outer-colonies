import { designConfig } from 'src/app/config/design';
import { MsgTypeInbound } from '../../../../../server/src/shared/config/enums';
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
        cardX + layoutConfig.game.cards.retractCardButton.xOffset,
        cardY + layoutConfig.game.cards.retractCardButton.yOffset,
        'icon_retract_card'
      )
      .setOrigin(0.5, 0.5)
      .setAlpha(designConfig.alpha.normal)
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
      designConfig.tint.primary,
      designConfig.tint.neutral,
      designConfig.tint.primary,
      designConfig.tint.primary
    );
  }
  setTintCritical() {
    this.image.setTint(
      designConfig.tint.secondary,
      designConfig.tint.neutral,
      designConfig.tint.secondary,
      designConfig.tint.secondary
    );
  }
  setTintHover() {
    this.image.setTint(designConfig.tint.neutral);
  }
  tween(cardX: number, cardY: number) {
    this.scene.tweens.add({
      targets: this.image,
      duration: animationConfig.duration.move,
      x: cardX + layoutConfig.game.cards.retractCardButton.xOffset,
      y: cardY + layoutConfig.game.cards.retractCardButton.yOffset
    });
  }
}
