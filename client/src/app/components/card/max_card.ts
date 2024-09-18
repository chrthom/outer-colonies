import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { constants } from '../../../../../server/src/shared/config/constants';
import { perspectiveConfig } from 'src/app/config/perspective';
import { MaxCardXPosition, MaxCardYPosition } from '../perspective';
import { animationConfig } from 'src/app/config/animation';

export default class MaxCard extends CardImage {
  private timerEvent?: Phaser.Time.TimerEvent;
  constructor(scene: Game) {
    super(scene, new MaxCardXPosition(0), new MaxCardYPosition(0), constants.cardBackSideID, {
      perspective: layoutConfig.game.cards.perspective.none,
      z: perspectiveConfig.distance.near
    });
    this.image.setDepth(layoutConfig.depth.maxCardLegacy);
    this.hide();
  }
  hide() {
    this.timerEvent?.destroy();
    this.image.setVisible(false);
  }
  show(cardId: number) {
    this.timerEvent = this.scene.time.delayedCall(animationConfig.duration.waitBeforeMaximize, () => {
      this.setCardId(cardId);
      this.updatePosition();
      this.image.setVisible(true);
    });
  }
  updatePosition() {
    const x =
      this.scene.input.mousePointer.x +
      layoutConfig.game.ui.maxCard.xOffset *
        (this.scene.input.mousePointer.x > layoutConfig.scene.width / 2 ? -1 : 1);
    const y =
      this.scene.input.mousePointer.y +
      layoutConfig.game.ui.maxCard.yOffset *
        (this.scene.input.mousePointer.y < layoutConfig.scene.height / 2 ? -1 : 1);
    this.setX(new MaxCardXPosition(x)).setY(new MaxCardYPosition(y));
  }
}
