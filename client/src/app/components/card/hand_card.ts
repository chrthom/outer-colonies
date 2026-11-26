import CardImage from './card_image';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { ClientHandCard } from '@shared/interfaces/client_state';
import { animationConfig } from '../../config/animation';
import { constants } from '@shared/config/constants';
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
  maximizeTacticCard() {
    this.scene.maximizedTacticCard?.destroy();
    this.scene.maximizedTacticCard = this.setDepth(layoutConfig.depth.maxedTacticCard)
      .setCardId(this.scene.session.state.highlightCardId ?? this.data.cardId)
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
  private invIndex(index: number) {
    const handData = this.scene.getPlayerState(this.ownedByPlayer);
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
    } else {
      this.scene.interaction.clickHandCard(this.uuid);
    }
  }
  private enableExpandOnPointerover() {
    this.image
      .on('pointerover', () => {
        this.scene.player.hand.flatMap(hc =>
          hc.tween({
            duration: animationConfig.duration.handExpand,
            x: hc.targetX(
              hc.data.index +
                (hc.data.index > this.data.index ? 1 : hc.data.index < this.data.index ? -1 : -0.5)
            ),
            y: hc
              .targetY()
              .plus(hc.data.index == this.data.index ? layoutConfig.game.cards.placement.hand.yExpand : 0)
          })
        );
      })
      .on('pointerout', () => {
        this.scene.player.hand.flatMap(hc =>
          hc.tween({
            duration: animationConfig.duration.handExpand,
            x: hc.targetX(),
            y: hc.targetY()
          })
        );
      });
  }
}
