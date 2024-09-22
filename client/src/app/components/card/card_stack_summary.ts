import Game from 'src/app/scenes/game';
import CardStack from './card_stack';
import { layoutConfig } from 'src/app/config/layout';
import { designConfig } from 'src/app/config/design';
import { animationConfig } from 'src/app/config/animation';

interface InfoBox {
  box: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
  value: Phaser.GameObjects.Text;
}

export default class CardStackSummary {
  cardStack: CardStack;
  private scene: Game;
  private infoBoxes!: InfoBox[];
  constructor(scene: Game, cardStack: CardStack) {
    this.cardStack = cardStack;
    this.scene = scene;
    this.createInfoBoxes();
    this.toDefaultAlpha();
  }
  destroy() {
    this.forAllObjects(o => this.tweenGameObject(o, 0, true));
  }
  highlight() {
    this.forAllObjects(o => this.tweenGameObject(o, 1));
  }
  toDefaultAlpha() {
    this.forAllObjects(o => this.tweenGameObject(o, designConfig.alpha.faded));
  }
  private createInfoBoxes() {
    const config = layoutConfig.game.cards.summaryBox;
    this.infoBoxes = this.cardStack.data.attributes.map((a, index) =>
      this.createInfoBox(
        this.cardStack.targetX.value2d +
          ((index % config.boxesPerRow) - (config.boxesPerRow - 1) / 2) * config.xStep,
        this.cardStack.targetY(this.cardStack.maxIndex).value2d -
          Math.floor(index / config.boxesPerRow) * config.yStep,
        a.warning ? 'red' : 'blue',
        a.icon,
        a.value
      )
    );
  }
  private createInfoBox(x: number, y: number, color: string, icon: string, value: number): InfoBox {
    const config = layoutConfig.game.cards.summaryBox;
    return {
      box: this.scene.add
        .image(x, y, `card_stack_info_box_${color}`)
        .setOrigin(0.5)
        .setDepth(layoutConfig.depth.indicator)
        .setAlpha(0),
      icon: this.scene.add
        .image(x - config.xOffset, y - config.yOffset, `attribute_${icon}`)
        .setOrigin(0.5)
        .setDepth(layoutConfig.depth.indicator)
        .setAlpha(0),
      value: this.scene.add
        .text(x + config.xOffset, y + config.yOffset, String(value))
        .setFontSize(layoutConfig.fontSize.small)
        .setFontFamily(designConfig.fontFamily.caption)
        .setColor(designConfig.color.neutral)
        .setAlign('center')
        .setOrigin(0.5)
        .setDepth(layoutConfig.depth.indicator)
        .setAlpha(0)
    };
  }
  private tweenGameObject(
    o: Phaser.GameObjects.GameObject,
    alpha: number,
    destroy?: boolean
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: [o],
      duration: animationConfig.duration.move,
      alpha: alpha,
      onComplete: () => {
        if (destroy) o.destroy();
      }
    });
  }
  private forAllObjects(f: (o: Phaser.GameObjects.GameObject) => void) {
    return this.infoBoxes.forEach(ib => [ib.box, ib.icon, ib.value].forEach(f));
  }
}
