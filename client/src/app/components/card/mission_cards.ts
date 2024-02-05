import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export default class MissionCards {
  minCards: CardImage[] = [];
  private scene!: Game;
  constructor(scene: Game) {
    this.scene = scene;
  }
  update() {
    if (this.scene.state && this.scene.state.battle) {
      const battle = this.scene.state.battle;
      if (this.minCards) this.minCards.forEach(c => c.destroy());
      this.minCards = battle.priceCardIds.map((id, index) => {
        return new CardImage(
          this.scene,
          layoutConfig.game.ui.missionCards.x + index * layoutConfig.game.ui.missionCards.xDistance,
          layoutConfig.game.ui.missionCards.y + index * layoutConfig.game.ui.missionCards.yDistance,
          id,
          {
            scale: layoutConfig.game.cards.scale.min
          }
        );
      });
      this.minCards.filter(c => c.cardId != 1).forEach(c => c.enableMaximizeOnMouseover());
    }
  }
}
