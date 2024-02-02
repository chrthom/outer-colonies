import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { BattleType, TurnPhase } from '../../../../../server/src/shared/config/enums';
import ValueIndicator from '../indicators/value_indicator';
import { ClientPlannedBattleHelper } from '../../../../../server/src/shared/interfaces/client_planned_battle';

export default class DeckCard extends CardImage {
  indicator?: ValueIndicator;
  constructor(scene: Game) {
    super(scene, layoutConfig.ui.deck.x, layoutConfig.ui.deck.y, 1);
    this.image.on('pointerdown', () => this.onClickAction());
  }
  update() {
    if (this.indicator) this.indicator.destroy();
    const cardsForMission = this.scene.plannedBattle.downsideCardsNum;
    this.indicator = new ValueIndicator(
      this.scene,
      this.scene.state.deckSize + (cardsForMission ? `/-${cardsForMission}` : ''),
      this.scene.state.deckSize - cardsForMission < 10,
      layoutConfig.ui.deck.x,
      layoutConfig.ui.deck.y,
      true,
      true
    );
  }
  private onClickAction() {
    if (
      this.scene.state &&
      this.scene.state.playerPendingAction &&
      this.scene.state.playerIsActive &&
      this.scene.state.turnPhase == TurnPhase.Build &&
      !this.scene.activeCards.hand
    ) {
      if (ClientPlannedBattleHelper.cardLimitReached(this.scene.plannedBattle)) {
        this.scene.resetView(BattleType.None);
      } else {
        if (this.scene.plannedBattle.type != BattleType.Mission) {
          this.scene.resetView(BattleType.Mission);
        }
        if (!ClientPlannedBattleHelper.cardLimitReached(this.scene.plannedBattle)) {
          this.scene.plannedBattle.downsideCardsNum++;
          this.scene.updateView();
        }
      }
    }
  }
}
