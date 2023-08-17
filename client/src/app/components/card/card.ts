import { ClientCard } from '../../../../../server/src/components/shared_interfaces/client_state';
import Game from '../../scenes/game';
import CardImage from './card_image';
import RetractCardButton from '../indicators/retract_card_button';
import { animationConfig } from 'src/app/config/animation';

export default class Card extends CardImage {
  data: ClientCard;
  retractCardButton?: RetractCardButton;
  constructor(
    scene: Game,
    x: number,
    y: number,
    opponentCard: boolean,
    cardStackUUID: string,
    data: ClientCard
  ) {
    super(scene, x, y, data.id, opponentCard);
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
  override destroy() {
    super.destroy();
    this.destroyButton();
  }
  destroyButton() {
    if (this.retractCardButton) this.retractCardButton.destroy();
  }
  animateAttack() {
    this.highlightSelected();
    this.scene.time.delayedCall(animationConfig.duration.attack, () => this.highlightReset());
  }
  override tween(tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig) {
    super.tween(tweenConfig);
    if (this.retractCardButton) this.retractCardButton.tween(tweenConfig['x'], tweenConfig['y']);
  }
}
