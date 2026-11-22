import { ClientCard } from '@shared/interfaces/client_state';
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
  /** Updates the card data in place and syncs the retract button, without recreating game objects. */
  update(data: ClientCard, x: number, y: number) {
    this.data = data;
    if (!data.retractable) {
      this.destroyRetractButton();
    } else {
      if (!this.retractCardButton) this.retractCardButton = new RetractCardButton(this.scene, this);
      this.retractCardButton.refresh(x, y);
    }
  }
  override destroy(): this {
    this.destroyRetractButton();
    return super.destroy();
  }
  destroyRetractButton() {
    this.retractCardButton?.destroy();
    this.retractCardButton = undefined;
  }
  animateAttack() {
    this.highlightSelected();
    this.scene.time.delayedCall(animationConfig.duration.attack, () => this.highlightReset());
  }
  override tween(config: CardTweenConfig) {
    config.xRotation ??= layoutConfig.game.cards.perspective.board;
    super.tween(config);
  }
}
