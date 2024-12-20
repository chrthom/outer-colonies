import CardImage from './card_image';
import Game from '../../scenes/game';
import { BattleType, TurnPhase } from '../../../../../server/src/shared/config/enums';
import ValueIndicator from '../indicators/value_indicator';
import { ClientPlannedBattleHelper } from '../../../../../server/src/shared/interfaces/client_planned_battle';
import { constants } from '../../../../../server/src/shared/config/constants';
import { layoutConfig } from 'src/app/config/layout';
import { perspectiveConfig } from 'src/app/config/perspective';

export default class DeckCard extends CardImage {
  indicator?: ValueIndicator;
  pile: Phaser.GameObjects.Plane;
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
    this.pile = scene.add
      .plane(perspectiveConfig.origin.x, perspectiveConfig.origin.y, 'card_pile_1')
      .setDepth(layoutConfig.depth.cardStack - 1)
      .setVisible(false);
    if (ownedByPlayer)
      this.image.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.onClickAction();
      });
    this.update();
  }
  update() {
    if (this.indicator) this.indicator.destroy();
    const cardsForMission = this.scene.plannedBattle.downsideCardsNum;
    this.indicator = new ValueIndicator(
      this.scene,
      this.deckSize + (cardsForMission ? `/-${cardsForMission}` : ''),
      this.deckSize - cardsForMission < 10,
      this.placementConfig.deck.x.value2d,
      this.placementConfig.deck.y.value2d,
      this.ownedByPlayer,
      true
    );
    this.pile.setTexture(`card_pile_${this.cardPileImageNum}`).setVisible(this.deckSize > 5);
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
  private get cardPileImageNum(): number {
    if (this.deckSize < 15) return 1;
    else if (this.deckSize < 30) return 2;
    else if (this.deckSize < 55) return 3;
    else return 4;
  }
  private get deckSize(): number {
    return this.scene.getPlayerState(this.ownedByPlayer).deckSize;
  }
}
