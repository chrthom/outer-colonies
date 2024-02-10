import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { constants } from '../../../../../server/src/shared/config/constants';

export default class MaxCard extends CardImage {
  constructor(scene: Game) {
    super(scene, 0, 0, constants.cardBackSideID, {
      scale: layoutConfig.game.cards.scale.max
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
    let y = this.scene.input.mousePointer.y + layoutConfig.game.ui.maxCard.yOffset;
    const cardHeight = layoutConfig.game.cards.size.original.height * layoutConfig.game.cards.scale.max;
    if (y < cardHeight) y = cardHeight;
    else if (y > layoutConfig.scene.height) y = layoutConfig.scene.height;
    this.setX(x).setY(y);
  }
}
