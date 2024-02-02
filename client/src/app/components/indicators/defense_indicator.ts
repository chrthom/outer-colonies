import { designConfig } from 'src/app/config/design';
import { ClientDefenseIcon } from '../../../../../server/src/shared/interfaces/client_state';
import { animationConfig } from '../../config/animation';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export default class DefenseIndicator {
  images: Phaser.GameObjects.Image[];
  private scene!: Game;
  private ownedByPlayer!: boolean;
  constructor(
    scene: Game,
    defenseIcons: ClientDefenseIcon[],
    cardX: number,
    cardY: number,
    ownedByPlayer: boolean
  ) {
    this.scene = scene;
    this.ownedByPlayer = ownedByPlayer;
    this.images = defenseIcons.map((icon, index) => {
      const color = icon.depleted ? designConfig.colors.secondary : designConfig.colors.primary;
      return scene.add
        .image(this.x(cardX), this.y(cardY, index), `icon_${icon.icon}`)
        .setOrigin(0.5, 0.5)
        .setTint(color, designConfig.colors.neutral, color, color)
        .setAlpha(designConfig.colors.alpha)
        .setDepth(layoutConfig.depth.indicators);
    });
  }
  destroy() {
    this.images.forEach(i => i.destroy());
  }
  tween(cardX: number, cardY: number) {
    this.images.forEach((image, index) => {
      this.scene.tweens.add({
        targets: [image],
        duration: animationConfig.duration.move,
        x: this.x(cardX),
        y: this.y(cardY, index)
      });
    });
  }
  private x(cardX: number) {
    return cardX + layoutConfig.game.cards.defenseIndicator.xOffset;
  }
  private y(cardY: number, index: number) {
    return (
      cardY +
      (this.ownedByPlayer
        ? layoutConfig.game.cards.defenseIndicator.yOffsetPlayer
        : layoutConfig.game.cards.defenseIndicator.yOffsetOpponent) +
      index * layoutConfig.game.cards.defenseIndicator.yDistance
    );
  }
}
