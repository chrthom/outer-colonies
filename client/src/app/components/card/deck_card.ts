import CardImage from './card_image';
import Game from '../../scenes/game';
import ValueIndicator from '../indicators/value_indicator';
import { constants } from '../../../../../server/src/shared/config/constants';
import { layoutConfig } from 'src/app/config/layout';

export default class DeckCard extends CardImage {
  indicator?: ValueIndicator;
  constructor(scene: Game, ownedByPlayer: boolean) {
    super(
      scene,
      DeckCard.getPlacementConfig(ownedByPlayer).deck.x,
      DeckCard.getPlacementConfig(ownedByPlayer).deck.y,
      constants.cardBackSideID,
      {
        isOpponentCard: !ownedByPlayer,
        perspective: layoutConfig.game.cards.perspective.board
      }
    );
    this.update();
  }
  update() {
    if (this.indicator) this.indicator.destroy();
    this.indicator = new ValueIndicator(
      this.scene,
      this.deckSize,
      this.deckSize < 10,
      this.placementConfig.deck.x.value2d,
      this.placementConfig.deck.y.value2d,
      this.ownedByPlayer
    );
    this.setPileSize(this.deckSize);
  }

  private get deckSize(): number {
    return this.scene.getPlayerState(this.ownedByPlayer).deckSize;
  }
}
