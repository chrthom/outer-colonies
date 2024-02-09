import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { ClientHandCard } from '../../../../../server/src/shared/interfaces/client_state';
import { BattleType, MsgTypeInbound, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { animationConfig } from '../../config/animation';
import { constants } from '../../../../../server/src/shared/config/constants';

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
        isOpponentCard: !data.ownedByPlayer
      }
    );
    this.uuid = data.uuid;
    this.update(data);
    if (this.ownedByPlayer) {
      this.image.on('pointerdown', () => this.onClickAction());
    }
    this.setDepth(layoutConfig.depth.handCard);
    if (data.ownedByPlayer) this.enableMaximizeOnMouseover();
  }
  update(data: ClientHandCard) {
    this.data = data;
    this.tween({
      targets: undefined,
      duration: animationConfig.duration.draw,
      x: this.x,
      y: this.y,
      angle: this.shortestAngle(this.angle)
    });
  }
  highlightPlayability() {
    this.highlightReset();
    if (this.data.playable) this.highlightSelectable();
  }
  override discard(toDeck?: boolean) {
    if (!this.ownedByPlayer && this.cardId == constants.cardBackSideID) {
      this.cardId = this.data.cardId;
      this.image.setTexture(`card_${this.cardId}`);
    }
    super.discard(toDeck);
  }
  private invIndex(data: ClientHandCard) {
    const handData = this.ownedByPlayer ? this.scene.state.player : this.scene.state.opponent;
    return handData.hand.length - data.index - 1;
  }
  private get x() {
    return (
      this.placementConfig.hand.x + this.invIndex(this.data) * layoutConfig.game.cards.placement.hand.xStep
    );
  }
  private get y() {
    return (
      this.placementConfig.hand.y +
      this.factor * this.invIndex(this.data) * layoutConfig.game.cards.placement.hand.yStep
    );
  }
  private get angle() {
    return (
      this.orientation +
      this.factor *
        (layoutConfig.game.cards.placement.hand.startAngle +
          this.invIndex(this.data) * layoutConfig.game.cards.placement.hand.angleStep)
    );
  }
  private get factor() {
    return this.ownedByPlayer ? 1 : -1;
  }
  private get orientation() {
    return this.ownedByPlayer ? 0 : 180;
  }
  private onClickAction() {
    if (this.scene.state.playerPendingAction) {
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
}
