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
    if (data.retractable) {
      this.retractCardButton = new RetractCardButton(
        scene,
        x,
        y,
        cardStackUUID,
        data.index,
        data.insufficientEnergy
      );
    }
  }
  override destroy(): this {
    this.destroyButton();
    return super.destroy();
  }
  destroyButton() {
    this.retractCardButton?.destroy();
  }
  animateAttack() {
    this.highlightSelected();
    this.scene.time.delayedCall(animationConfig.duration.attack, () => this.highlightReset());
  }
  override tween(config: CardTweenConfig): Phaser.Tweens.Tween {
    config.xRotation ??= layoutConfig.game.cards.perspective.board;
    this.retractCardButton?.tween(config.x.value2d, config.y.value2d);
    return super.tween(config);
  }
}
