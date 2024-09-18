import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { constants } from '../../../../../server/src/shared/config/constants';
import { perspectiveConfig } from 'src/app/config/perspective';
import { ZoomCardXPosition, ZoomCardYPosition } from '../perspective';
import { animationConfig } from 'src/app/config/animation';

export default class ZoomCard extends CardImage {
  private activeTween?: Phaser.Tweens.Tween;
  constructor(scene: Game) {
    super(scene, new ZoomCardXPosition(0), new ZoomCardYPosition(0), constants.cardBackSideID, {
      perspective: layoutConfig.game.cards.perspective.none,
      z: perspectiveConfig.distance.near
    });
    this.image.setDepth(layoutConfig.depth.zoomCard).setVisible(false);
  }
  hide() {
    this.activeTween?.stop();
    this.activeTween = this.scene.tweens.add({
      duration: animationConfig.duration.zoomCard,
      targets: [this.image],
      alpha: 0,
      onComplete: () => this.image.setVisible(false)
    });
  }
  show(cardId: number) {
    this.activeTween?.stop();
    this.setCardId(cardId);
    this.image.setVisible(true).setAlpha(0);
    this.activeTween = this.scene.tweens.add({
      duration: animationConfig.duration.zoomCard,
      targets: [this.image],
      alpha: 1
    });
  }
  updatePosition(): this {
    return this.setX(this.xZoom).setY(this.yZoom);
  }
  private get xZoom(): ZoomCardXPosition {
    return new ZoomCardXPosition(
      this.scene.input.mousePointer.x +
        layoutConfig.game.ui.maxCard.xOffset *
          (this.scene.input.mousePointer.x > layoutConfig.scene.width / 2 ? -1 : 1)
    );
  }
  private get yZoom(): ZoomCardYPosition {
    return new ZoomCardYPosition(
      this.scene.input.mousePointer.y +
        layoutConfig.game.ui.maxCard.yOffset *
          (this.scene.input.mousePointer.y < layoutConfig.scene.height / 2 ? -1 : 1)
    );
  }
}
