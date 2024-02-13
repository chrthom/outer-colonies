import { designConfig } from 'src/app/config/design';
import { animationConfig } from '../../config/animation';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export default class ValueIndicator {
  private shape: Phaser.GameObjects.Shape;
  private text: Phaser.GameObjects.Text;
  private scene: Game;
  private ownedByPlayer: boolean;
  constructor(
    scene: Game,
    value: string,
    critical: boolean,
    cardX: number,
    cardY: number,
    ownedByPlayer: boolean,
    hasEllipseShape: boolean
  ) {
    this.scene = scene;
    this.ownedByPlayer = ownedByPlayer;
    if (hasEllipseShape) {
      this.shape = scene.add
        .ellipse(
          this.x(cardX),
          this.y(cardY),
          64,
          32,
          critical ? designConfig.tint.opponent : designConfig.tint.player,
          designConfig.alpha.normal
        )
        .setOrigin(0.5, 0.5)
        .setDepth(layoutConfig.depth.indicators);
    } else {
      this.shape = scene.add
        .star(
          this.x(cardX),
          this.y(cardY),
          12,
          16,
          22,
          critical ? designConfig.tint.opponent : designConfig.tint.player,
          designConfig.alpha.normal
        )
        .setOrigin(0.5, 0.5)
        .setDepth(layoutConfig.depth.indicators);
    }
    this.text = scene.add
      .text(this.x(cardX), this.y(cardY), value)
      .setFontSize(layoutConfig.fontSize.small)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.hover)
      .setAlign('center')
      .setOrigin(0.5, 0.5)
      .setDepth(layoutConfig.depth.indicators);
  }
  destroy() {
    this.shape.destroy();
    this.text.destroy();
  }
  tween(cardX: number, cardY: number) {
    this.scene.tweens.add({
      targets: [this.text, this.shape],
      duration: animationConfig.duration.move,
      x: this.x(cardX),
      y: this.y(cardY)
    });
  }
  private x(cardX: number) {
    return (
      cardX +
      (this.ownedByPlayer
        ? layoutConfig.game.cards.damageIndicator.xOffsetPlayer
        : layoutConfig.game.cards.damageIndicator.xOffsetOpponent)
    );
  }
  private y(cardY: number) {
    return (
      cardY +
      (this.ownedByPlayer
        ? layoutConfig.game.cards.damageIndicator.yOffsetPlayer
        : layoutConfig.game.cards.damageIndicator.yOffsetOpponent)
    );
  }
}
