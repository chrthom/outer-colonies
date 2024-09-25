import { designConfig } from 'src/app/config/design';
import { MsgTypeInbound } from '../../../../../server/src/shared/config/enums';
import { animationConfig } from '../../config/animation';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import Card from '../card/card';

export default class RetractCardButton {
  image: Phaser.GameObjects.Image;
  card: Card;
  private tween?: Phaser.Tweens.Tween;
  private scene!: Game;
  constructor(scene: Game, card: Card) {
    this.scene = scene;
    this.card = card;
    this.image = scene.add
      .image(card.x.value2d, card.y.value2d, 'icon_retract_card')
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(layoutConfig.depth.indicator)
      .setInteractive({
        useHandCursor: true
      });
    if (card.data.insufficientEnergy) this.setTintCritical();
    else this.setTintNormal();
  }
  show(x: number, y: number, onPointerOver: () => void, onPointerOut: () => void): this {
    this.image
      .setX(x + layoutConfig.game.cards.retractCardButton.xOffset)
      .setY(y + layoutConfig.game.cards.retractCardButton.yOffset)
      .off('pointerover')
      .off('pointerout')
      .off('pointerdown')
      .on('pointerover', () => {
        this.setTintHover();
        onPointerOver();
      })
      .on('pointerout', () => {
        this.card.data.insufficientEnergy ? this.setTintCritical() : this.setTintNormal();
        onPointerOut();
      })
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown())
          this.scene.socket.emit(MsgTypeInbound.Retract, this.card.cardStackUUID, this.card.data.index);
      });
    this.tweenAlpha(true);
    return this;
  }
  hide(): this {
    this.tweenAlpha(false);
    return this;
  }
  destroy() {
    this.image.destroy();
  }
  private tweenAlpha(show: boolean) {
    this.tween?.stop();
    this.tween = this.scene.tweens.add({
      targets: this.image,
      duration: animationConfig.duration.displayIndicator,
      alpha: show ? designConfig.alpha.normal : 0
    });
  }
  private setTintNormal() {
    this.image.setTint(
      designConfig.tint.player,
      designConfig.tint.neutral,
      designConfig.tint.player,
      designConfig.tint.player
    );
  }
  private setTintCritical() {
    this.image.setTint(
      designConfig.tint.opponent,
      designConfig.tint.neutral,
      designConfig.tint.opponent,
      designConfig.tint.opponent
    );
  }
  private setTintHover() {
    this.image.setTint(designConfig.tint.neutral);
  }
}
