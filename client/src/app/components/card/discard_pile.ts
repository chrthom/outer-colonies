import Game from '../../scenes/game';
import CardImage from './card_image';
import ValueIndicator from '../indicators/value_indicator';
import { constants } from '../../../../../server/src/shared/config/constants';
import { layoutConfig } from 'src/app/config/layout';

export default class DiscardPile extends CardImage {
  cardIds: number[] = [];
  indicator?: ValueIndicator;
  constructor(scene: Game, ownedByPlayer: boolean) {
    super(
      scene,
      DiscardPile.getPlacementConfig(ownedByPlayer).discardPile.x,
      DiscardPile.getPlacementConfig(ownedByPlayer).discardPile.y,
      constants.cardBackSideID,
      {
        isOpponentCard: !ownedByPlayer,
        perspective: layoutConfig.game.cards.perspective.board
      }
    );
    this.update([]);
  }
  update(cardIds?: number[]) {
    if (cardIds) this.cardIds = cardIds;
    if (this.indicator) this.indicator.destroy();
    if (this.topCard != constants.cardBackSideID) {
      this.setCardId(this.topCard).setVisible(true).enableMaximizeOnRightclick();
      this.indicator = new ValueIndicator(
        this.scene,
        this.cardIds.length.toString(),
        false,
        this.placementConfig.discardPile.x.value2d,
        this.placementConfig.discardPile.y.value2d,
        this.ownedByPlayer
      );
      this.setPileSize(this.cardIds.length);
    } else {
      this.setVisible(false);
    }
  }
  override destroy(): this {
    if (this.indicator) this.indicator.destroy();
    return super.destroy();
  }
  private get topCard() {
    if (this.cardIds.length == 0) return constants.cardBackSideID;
    let topCard = this.cardIds[this.cardIds.length - 1];
    if (
      this.scene.maximizedTacticCard?.cardId == topCard &&
      this.scene.maximizedTacticCard?.ownedByPlayer == this.ownedByPlayer
    ) {
      if (this.cardIds.length <= 1) return constants.cardBackSideID;
      topCard = this.cardIds[this.cardIds.length - 2];
    }
    return topCard;
  }
}
