import { designConfig } from 'src/app/config/design';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export default class ValueIndicator {
  private shape: Phaser.GameObjects.Shape;
  private text: Phaser.GameObjects.Text;
  private ownedByPlayer: boolean;
  constructor(
    scene: Game,
    value: number,
    critical: boolean,
    cardX: number,
    cardY: number,
    ownedByPlayer: boolean
  ) {
    this.ownedByPlayer = ownedByPlayer;
    this.shape = scene.add
      .ellipse(
        this.x(cardX),
        this.y(cardY),
        64,
        32,
        critical ? designConfig.tint.opponent : designConfig.tint.player,
        designConfig.alpha.normal
      )
      .setOrigin(0.5)
      .setDepth(layoutConfig.depth.indicator);
    this.text = scene.add
      .text(this.x(cardX), this.y(cardY), value.toString())
      .setFontSize(layoutConfig.fontSize.small)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.hover)
      .setAlign('center')
      .setOrigin(0.5)
      .setDepth(layoutConfig.depth.indicator);
  }
  destroy() {
    this.shape.destroy();
    this.text.destroy();
  }
  /** Updates value and critical state in place, without recreating the objects. */
  update(value: number, critical: boolean) {
    this.text.setText(value.toString());
    this.shape.setFillStyle(
      critical ? designConfig.tint.opponent : designConfig.tint.player,
      designConfig.alpha.normal
    );
  }
  private x(cardX: number) {
    return (
      cardX +
      (this.ownedByPlayer
        ? layoutConfig.game.cards.valueIndicator.xOffsetPlayer
        : layoutConfig.game.cards.valueIndicator.xOffsetOpponent)
    );
  }
  private y(cardY: number) {
    return (
      cardY +
      (this.ownedByPlayer
        ? layoutConfig.game.cards.valueIndicator.yOffsetPlayer
        : layoutConfig.game.cards.valueIndicator.yOffsetOpponent)
    );
  }
}
