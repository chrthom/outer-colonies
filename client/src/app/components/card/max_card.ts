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
    let x = this.scene.input.mousePointer.x + layoutConfig.game.ui.maxCard.xOffset;
    if (this.scene.input.mousePointer.x > layoutConfig.scene.width / 2) {
      x = this.scene.input.mousePointer.x - layoutConfig.game.ui.maxCard.xOffset;
    }
    let y = this.scene.input.mousePointer.y + layoutConfig.game.ui.maxCard.yOffset;
    const cardHeight = layoutConfig.game.cards.size.normal.height * layoutConfig.game.cards.scale.max;
    if (y < cardHeight) y = cardHeight;
    this.setX(x).setY(y);
  }
}
