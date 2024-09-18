import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { constants } from '../../../../../server/src/shared/config/constants';
import { perspectiveConfig } from 'src/app/config/perspective';
import { MaxCardXPosition, MaxCardYPosition } from '../perspective';
import { animationConfig } from 'src/app/config/animation';

export default class MaxCard extends CardImage {
  private activeTween?: Phaser.Tweens.Tween;
  constructor(scene: Game) {
    super(scene, new MaxCardXPosition(0), new MaxCardYPosition(0), constants.cardBackSideID, {
      perspective: layoutConfig.game.cards.perspective.none,
      z: perspectiveConfig.distance.near
    });
    this.image.setDepth(layoutConfig.depth.maxCard).setVisible(false);
  }
  hide() {
    this.activeTween?.stop();
    this.activeTween = this.scene.tweens.add({
      duration: animationConfig.duration.fadeMaxedCard,
      targets: [ this.image ],
      alpha: 0,
      onComplete: () => this.image.setVisible(false)
    });
  }
  show(cardId: number) {
    this.activeTween?.stop();
    this.setCardId(cardId);
    this.image
      .setVisible(true)
      .setAlpha(0);
    this.activeTween = this.scene.tweens.add({
      duration: animationConfig.duration.fadeMaxedCard,
      targets: [ this.image ],
      alpha: 1
    });
  }
  updatePosition(): this {
    return this.setX(this.xMaxed).setY(this.yMaxed);
  }
  private get xMaxed(): MaxCardXPosition {
    return new MaxCardXPosition(this.scene.input.mousePointer.x +
    layoutConfig.game.ui.maxCard.xOffset *
      (this.scene.input.mousePointer.x > layoutConfig.scene.width / 2 ? -1 : 1));
  }
  private get yMaxed(): MaxCardYPosition {
    return new MaxCardYPosition(this.scene.input.mousePointer.y +
    layoutConfig.game.ui.maxCard.yOffset *
      (this.scene.input.mousePointer.y < layoutConfig.scene.height / 2 ? -1 : 1));
  }
}
