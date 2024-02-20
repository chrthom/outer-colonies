import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { constants } from '../../../../../server/src/shared/config/constants';
import { perspectiveConfig } from 'src/app/config/perspective';

export default class MaxCard extends CardImage {
  constructor(scene: Game) {
    super(scene, 0, 0, constants.cardBackSideID, {
      perspective: layoutConfig.game.cards.perspective.none,
      z: perspectiveConfig.distance.near
    });
    this.image.setDepth(layoutConfig.depth.maxCard);
    this.hide();
  }
  hide() {
    this.image.setVisible(false);
  }
  show(cardId: number) {
    this.setCardId(cardId);
    this.updatePosition();
    this.image.setVisible(true);
  }
  updatePosition() {
    const x =
      this.scene.input.mousePointer.x +
      layoutConfig.game.ui.maxCard.xOffset *
        (this.scene.input.mousePointer.x > layoutConfig.scene.width / 2 ? -1 : 1);
    let y =
      this.scene.input.mousePointer.y +
      layoutConfig.game.ui.maxCard.yOffset *
        (this.scene.input.mousePointer.y < layoutConfig.scene.height / 2 ? -1 : 1);
    /*
    const halfCardHeight =
      (layoutConfig.game.cards.size.original.height * layoutConfig.game.cards.scale.max) / 2;
    if (y < halfCardHeight) y = halfCardHeight;
    else if (y > layoutConfig.scene.height - halfCardHeight) y = layoutConfig.scene.height - halfCardHeight;
    */
    this.setX(perspectiveConfig.toMaxCardX(x)).setY(perspectiveConfig.toMaxCardY(y));
  }
}
