import { ClientCard } from '../../../../../server/src/shared/interfaces/client_state';
import Game from '../../scenes/game';
import CardImage, { CardTweenConfig } from './card_image';
import RetractCardButton from '../buttons/retract_card_button';
import { animationConfig } from 'src/app/config/animation';
import { layoutConfig } from 'src/app/config/layout';
import { CardXPosition, CardYPosition } from '../perspective';

export default class Card extends CardImage {
  data: ClientCard;
  retractCardButton?: RetractCardButton;
  cardStackUUID: string;
  constructor(
    scene: Game,
    x: CardXPosition,
    y: CardYPosition,
    opponentCard: boolean,
    cardStackUUID: string,
    data: ClientCard
  ) {
    super(scene, x, y, data.id, {
      isOpponentCard: opponentCard,
      cropped: true,
      perspective: layoutConfig.game.cards.perspective.board
    });
    this.data = data;
    this.cardStackUUID = cardStackUUID;
    this.retractCardButton = data.retractable ? new RetractCardButton(this.scene, this) : undefined;
  }
  override destroy(): this {
    this.destroyRetractButton();
    return super.destroy();
  }
  destroyRetractButton() {
    this.retractCardButton?.destroy();
  }
  animateAttack() {
    this.highlightSelected();
    this.scene.time.delayedCall(animationConfig.duration.attack, () => this.highlightReset());
  }
  override tween(config: CardTweenConfig): Phaser.Tweens.Tween[] {
    config.xRotation ??= layoutConfig.game.cards.perspective.board;
    return super.tween(config);
  }
}
