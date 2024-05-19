import { CardType } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import InfrastructureCard from '../types/infrastructure_card';

export class Card305 extends InfrastructureCard {
  private multiplicatorFactor = 5;
  private multiplicatorActionPool = new ActionPool(
    ...new Array(this.multiplicatorFactor).fill(
      new CardAction(CardType.Equipment, CardType.Hull, CardType.Infrastructure, CardType.Tactic)
    )
  );
  constructor() {
    super(305, 'Terraformer', 1, {
      energy: -4,
      psi: -2
    });
  }
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn(player: Player) {
    const relevantCardDrawn = this.getDrawnCards(player).some(c => c.type == CardType.Orb);
    if (relevantCardDrawn) {
      player.drawCards(this.multiplicatorFactor);
      player.actionPool.push(...this.multiplicatorActionPool.pool);
    }
  }
  onEndTurn() {}
}
