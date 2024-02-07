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
    this.image.setTexture(`card_${cardId}`);
    this.image.setVisible(true);
  }
}
