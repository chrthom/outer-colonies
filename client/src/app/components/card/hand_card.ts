import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { ClientHandCard } from '../../../../../server/src/shared/interfaces/client_state';
import { BattleType, MsgTypeInbound, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { animationConfig } from '../../config/animation';

export default class HandCard extends CardImage {
  uuid: string;
  data!: ClientHandCard;
  constructor(scene: Game, data: ClientHandCard) {
    super(
      scene,
      layoutConfig.game.cards.placement.player.deck.x,
      layoutConfig.game.cards.placement.player.deck.y,
      data.cardId,
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
    this.enableMaximizeOnMouseover();
  }
  update(data: ClientHandCard) {
    this.data = data;
    this.tween({
      targets: undefined,
      duration: animationConfig.duration.draw,
      x: this.x,
      y: this.y,
      angle: this.angle
    });
  }
  highlightPlayability() {
    this.highlightReset();
    if (this.data.playable) this.highlightSelectable();
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
      this.placementConfig.hand.y + this.invIndex(this.data) * layoutConfig.game.cards.placement.hand.yStep
    );
  }
  private get angle() {
    return (
      layoutConfig.game.cards.placement.hand.startAngle +
      this.invIndex(this.data) * layoutConfig.game.cards.placement.hand.angleStep
    );
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
