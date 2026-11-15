import Game from 'src/app/scenes/game';
import CardStack from './card_stack';
import { ClientCardStackAttribute } from '../../../../../server/src/shared/interfaces/client_state';
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
    this.infoBoxes = [];
    this.update();
  }
  /**
   * Syncs the info boxes with the current stack attributes: existing boxes are
   * repositioned and updated in place, surplus boxes are faded out and new
   * boxes faded in. No objects are recreated for unchanged attributes.
   */
  update() {
    const config = layoutConfig.game.cards.summaryBox;
    const attributes = this.cardStack.data.attributes;
    while (this.infoBoxes.length > attributes.length) {
      const infoBox = this.infoBoxes.pop()!;
      [infoBox.box, infoBox.icon, infoBox.value].forEach(o => this.tweenGameObject(o, 0, true));
    }
    attributes.forEach((a, index) => {
      const x =
        this.cardStack.targetX.value2d +
        ((index % config.boxesPerRow) - (config.boxesPerRow - 1) / 2) * config.xStep;
      const y =
        this.cardStack.targetY(this.cardStack.maxIndex).value2d -
        Math.floor(index / config.boxesPerRow) * config.yStep;
      if (index < this.infoBoxes.length) {
        this.updateInfoBox(this.infoBoxes[index], a, x, y);
      } else {
        const infoBox = this.createInfoBox(x, y, a.warning ? 'red' : 'blue', a.icon, a.value);
        this.infoBoxes.push(infoBox);
        [infoBox.box, infoBox.icon, infoBox.value].forEach(o =>
          this.tweenGameObject(o, designConfig.alpha.faded)
        );
      }
    });
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
  private updateInfoBox(infoBox: InfoBox, attribute: ClientCardStackAttribute, x: number, y: number) {
    const config = layoutConfig.game.cards.summaryBox;
    infoBox.box.setTexture(`card_stack_info_box_${attribute.warning ? 'red' : 'blue'}`);
    infoBox.icon.setTexture(`attribute_${attribute.icon}`);
    infoBox.value.setText(String(attribute.value));
    this.tweenGameObject(infoBox.box, designConfig.alpha.faded, false, x, y);
    this.tweenGameObject(
      infoBox.icon,
      designConfig.alpha.faded,
      false,
      x - config.xOffset,
      y - config.yOffset
    );
    this.tweenGameObject(
      infoBox.value,
      designConfig.alpha.faded,
      false,
      x + config.xOffset,
      y + config.yOffset
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
    destroy?: boolean,
    x?: number,
    y?: number
  ): Phaser.Tweens.Tween {
    const tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: [o],
      duration: animationConfig.duration.move,
      alpha: alpha
    };
    if (x != undefined) tweenConfig['x'] = x;
    if (y != undefined) tweenConfig['y'] = y;
    if (destroy) tweenConfig.onComplete = () => o.destroy();
    return this.scene.tweens.add(tweenConfig);
  }
  private forAllObjects(f: (o: Phaser.GameObjects.GameObject) => void) {
    return this.infoBoxes.forEach(ib => [ib.box, ib.icon, ib.value].forEach(f));
  }
}
