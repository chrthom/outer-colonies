import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export default class MaxCard extends CardImage {
  constructor(scene: Game) {
    super(scene, layoutConfig.game.ui.maxCard.x, layoutConfig.game.ui.maxCard.y, 1, {
      scale: layoutConfig.game.cards.scale.max
    });
    this.hide();
  }
  hide() {
    this.image.setVisible(false);
    this.scene.obj?.continueButton?.showPrompt();
  }
  show(cardId: number) {
    this.image.setTexture(`card_${cardId}`);
    this.image.setVisible(true);
    this.scene.obj.continueButton?.hidePrompt();
  }
}
