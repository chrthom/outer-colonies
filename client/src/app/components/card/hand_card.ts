import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { ClientHandCard } from '../../../../../server/src/shared/interfaces/client_state';
import { BattleType, MsgTypeInbound, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { animationConfig } from '../../config/animation';
import { constants } from '../../../../../server/src/shared/config/constants';
import { perspectiveConfig } from 'src/app/config/perspective';
import { CardXPosition, CardYPosition } from '../perspective';

export default class HandCard extends CardImage {
  uuid: string;
  data!: ClientHandCard;
  constructor(scene: Game, data: ClientHandCard) {
    super(
      scene,
      HandCard.getPlacementConfig(data.ownedByPlayer).deck.x,
      HandCard.getPlacementConfig(data.ownedByPlayer).deck.y,
      data.ownedByPlayer ? data.cardId : constants.cardBackSideID,
      {
        isOpponentCard: !data.ownedByPlayer,
        perspective: layoutConfig.game.cards.perspective.board
      }
    );
    this.uuid = data.uuid;
    this.update(data);
    this.image.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) this.onClickAction();
    });
    this.setDepth(layoutConfig.depth.handCard);
    if (data.ownedByPlayer) {
      this.enableMaximizeOnRightclick();
      this.enableExpandOnPointerover();
    }
  }
  update(data: ClientHandCard) {
    this.data = data;
    this.tween({
      duration: animationConfig.duration.draw,
      x: this.targetX(),
      y: this.targetY(),
      xRotation: layoutConfig.game.cards.perspective.neutral,
      angle: this.shortestAngle(this.targetAngle)
    });
  }
  highlightPlayability() {
    this.highlightReset();
    if (this.data.playable) this.highlightSelectable();
  }
  maximizeTacticCard() {
    this.scene.maximizedTacticCard?.destroy();
    this.scene.maximizedTacticCard = this.setDepth(layoutConfig.depth.maxedTacticCard)
      .setCardId(this.data.cardId) // To display if card's origin is opponent's hand
      .highlightReset();
    if (!this.data.ownedByPlayer) this.setAngle(this.angle + 180);
    this.tween({
      duration: animationConfig.duration.showTacticCard,
      x: layoutConfig.game.ui.maxedTacticCard.x,
      y: layoutConfig.game.ui.maxedTacticCard.y,
      z: perspectiveConfig.distance.near,
      xRotation: layoutConfig.game.cards.perspective.neutral,
      angle: this.shortestAngle(0)
    });
  }
  override discard(toDeck?: boolean): this {
    if (!this.ownedByPlayer && this.cardId == constants.cardBackSideID) {
      this.setCardId(this.data.cardId);
    }
    return super.discard(toDeck);
  }
  private invIndex(index: number) {
    const handData = this.ownedByPlayer ? this.scene.state.player : this.scene.state.opponent;
    return handData.hand.length - index - 1;
  }
  private targetX(index?: number): CardXPosition {
    return new CardXPosition(
      this.placementConfig.hand.x.value2d +
        this.invIndex(index ?? this.data.index) * layoutConfig.game.cards.placement.hand.xStep
    );
  }
  private targetY(index?: number): CardYPosition {
    return new CardYPosition(
      this.placementConfig.hand.y.value2d +
        this.factor * this.invIndex(index ?? this.data.index) * layoutConfig.game.cards.placement.hand.yStep
    );
  }
  private get targetAngle() {
    return (
      this.orientation +
      this.factor *
        (layoutConfig.game.cards.placement.hand.startAngle +
          this.invIndex(this.data.index) * layoutConfig.game.cards.placement.hand.angleStep)
    );
  }
  private get factor() {
    return this.ownedByPlayer ? 1 : -1;
  }
  private get orientation() {
    return this.ownedByPlayer ? 0 : 180;
  }
  private onClickAction() {
    if (this.scene.maximizedTacticCard == this) {
      this.scene.discardMaximizedTacticCard();
    } else if (this.ownedByPlayer && this.scene.state.playerPendingAction) {
      if (
        this.data.playable &&
        (this.scene.state.turnPhase != TurnPhase.Build || this.scene.plannedBattle.type == BattleType.None)
      ) {
        const reset = this.scene.activeCards.hand == this.uuid;
        this.scene.activeCards.stack = undefined;
        this.scene.activeCards.hand = undefined;
        if (!reset) this.scene.activeCards.hand = this.uuid;
        this.scene.updateView();
      } else if (this.scene.state.turnPhase == TurnPhase.End) {
        this.scene.socket.emit(MsgTypeInbound.Discard, this.uuid);
      }
    }
  }
  private enableExpandOnPointerover() {
    this.image
      .on('pointerover', () => {
        this.scene.animations.handCardExpand?.forEach(t => t.stop());
        this.scene.animations.handCardExpand = this.scene.player.hand.map(hc =>
          hc.tween({
            duration: animationConfig.duration.handExpand,
            x: hc.targetX(hc.data.index + (hc.data.index > this.data.index ? 1 : -1)),
            y: hc.targetY().plus(hc.data.index == this.data.index ? layoutConfig.game.cards.placement.hand.yExpand : 0)
          })
        );
      })
      .on('pointerout', () => {
        this.scene.animations.handCardExpand?.forEach(t => t.stop());
        this.scene.animations.handCardExpand = this.scene.player.hand.map(hc =>
          hc.tween({
            duration: animationConfig.duration.handExpand,
            x: hc.targetX(),
            y: hc.targetY()
          })
        );
      });
  }
}
