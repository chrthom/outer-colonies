import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { constants } from '../../../../../server/src/shared/config/constants';

export default class MaxCard extends CardImage {
  constructor(scene: Game) {
    super(scene, layoutConfig.game.ui.maxCard.x, layoutConfig.game.ui.maxCard.y, constants.cardBackSideID, {
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
    this.setX(this.scene.input.mousePointer.x + 315).setY(this.scene.input.mousePointer.y + 100);
  }
}
