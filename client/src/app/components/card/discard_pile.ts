import { BattleType, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { ClientPlannedBattle } from '../../../../../server/src/shared/interfaces/client_planned_battle';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import CardImage from './card_image';
import ValueIndicator from '../indicators/value_indicator';

export default class DiscardPile extends CardImage {
  cardIds: number[] = [];
  indicator: ValueIndicator;
  constructor(scene: Game) {
    super(scene, layoutConfig.discardPile.x, layoutConfig.discardPile.y, 1);
    this.update([]);
  }
  update(cardIds?: number[]) {
    if (cardIds) this.cardIds = cardIds;
    if (this.indicator) this.indicator.destroy();
    if (this.cardIds.length == 0) {
      this.setVisible(false);
    } else {
      this.setCardId(this.getTopCard());
      this.image.off('pointerdown').on('pointerdown', () => this.onClickAction());
      this.setVisible(true);
      this.enableMaximizeOnMouseover();
      const cardsForMission = this.scene.plannedBattle.upsideCardsNum;
      this.indicator = new ValueIndicator(
        this.scene,
        this.cardIds.length + (cardsForMission ? `/-${cardsForMission}` : ''),
        false,
        layoutConfig.discardPile.x,
        layoutConfig.discardPile.y,
        true,
        true
      );
    }
  }
  override destroy() {
    super.destroy();
    if (this.indicator) this.indicator.destroy();
  }
  private getTopCard() {
    return this.cardIds.length == 0 ? 1 : this.cardIds[this.cardIds.length - 1];
  }
  private onClickAction() {
    if (
      this.scene.state &&
      this.scene.state.playerPendingAction &&
      this.scene.state.playerIsActive &&
      this.scene.state.turnPhase == TurnPhase.Build &&
      !this.scene.activeCards.hand
    ) {
      if (ClientPlannedBattle.cardLimitReached(this.scene.plannedBattle)) {
        this.scene.resetView(BattleType.None);
      } else if (this.scene.plannedBattle.upsideCardsNum < this.cardIds.length) {
        if (this.scene.plannedBattle.type != BattleType.Mission) {
          this.scene.resetView(BattleType.Mission);
        }
        if (!ClientPlannedBattle.cardLimitReached(this.scene.plannedBattle)) {
          this.scene.plannedBattle.upsideCardsNum++;
          this.scene.updateView();
        }
      }
    }
  }
}
