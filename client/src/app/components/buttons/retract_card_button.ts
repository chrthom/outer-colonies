import { designConfig } from 'src/app/config/design';
import { MsgTypeInbound } from '../../../../../server/src/shared/config/enums';
import { animationConfig } from '../../config/animation';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import Card from '../card/card';

export default class RetractCardButton {
  image: Phaser.GameObjects.Image;
  card: Card;
  private tweenAnimation?: Phaser.Tweens.Tween;
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
    if (this.isCritical) {
      this.setTintCritical();
      this.show(
        this.card.x.value2d,
        this.card.y.value2d,
        () => {},
        () => {}
      );
    } else this.setTintNormal();
  }
  show(x: number, y: number, onPointerOver: () => void, onPointerOut: () => void): this {
    this.image
      .off('pointerover')
      .off('pointerout')
      .off('pointerdown')
      .on('pointerover', () => {
        this.setTintHover();
        onPointerOver();
      })
      .on('pointerout', () => {
        if (this.card.data.insufficientEnergy) this.setTintCritical();
        else this.setTintNormal();
        onPointerOut();
      })
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown())
          this.scene.socket.emit(MsgTypeInbound.Retract, this.card.cardStackUUID, this.card.data.uuid);
      });
    this.tween(true, x, y);
    return this;
  }
  hide(): this {
    this.tween(false, this.card.x.value2d, this.card.y.value2d);
    return this;
  }
  destroy() {
    this.image.destroy();
  }
  private tween(show: boolean, x: number, y: number) {
    this.tweenAnimation?.stop();
    this.tweenAnimation = this.scene.tweens.add({
      targets: this.image,
      duration: animationConfig.duration.displayIndicator,
      alpha: show || this.isCritical ? designConfig.alpha.normal : 0,
      x: x + layoutConfig.game.cards.retractCardButton.xOffset,
      y: y + layoutConfig.game.cards.retractCardButton.yOffset
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
  private get isCritical() {
    return this.card.data.insufficientEnergy;
  }
}
