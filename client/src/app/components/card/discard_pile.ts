import { BattleType, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { ClientPlannedBattleHelper } from '../../../../../server/src/shared/interfaces/client_planned_battle';
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
      this.image.off('pointerdown').on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.onClickAction();
      });
      const cardsForMission = this.scene.plannedBattle.upsideCardsNum;
      this.indicator = new ValueIndicator(
        this.scene,
        this.cardIds.length + (cardsForMission ? `/-${cardsForMission}` : ''),
        false,
        this.placementConfig.discardPile.x.value2d,
        this.placementConfig.discardPile.y.value2d,
        true,
        true
      );
    }
  }
  override destroy() {
    super.destroy();
    if (this.indicator) this.indicator.destroy();
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
      } else if (this.scene.plannedBattle.upsideCardsNum < this.cardIds.length) {
        if (this.scene.plannedBattle.type != BattleType.Mission) {
          this.scene.resetView(BattleType.Mission);
        }
        if (!ClientPlannedBattleHelper.cardLimitReached(this.scene.plannedBattle)) {
          this.scene.plannedBattle.upsideCardsNum++;
          this.scene.updateView();
        }
      }
    }
  }
}
