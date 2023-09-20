import { CardType } from '../../config/enums';
import { rules } from '../../config/rules';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import Card from '../card';
import CardStack from '../card_stack';

export default class ColonyCard extends Card {
  constructor() {
    super(0, 'Colony', CardType.Colony, 0, {
      hp: rules.colonyHP,
      xi: 999,
      phi: 999,
      omega: 999,
      delta: 999,
      psi: 999,
      handCardLimit: rules.maxHandCards
    });
  }
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
  override get actionPool(): ActionPool {
    return new ActionPool(
      new CardAction(CardType.Equipment),
      new CardAction(CardType.Hull),
      new CardAction(CardType.Infrastructure),
      new CardAction(CardType.Orb),
      new CardAction(CardType.Tactic)
    );
  }
  override canBeRetracted(): boolean {
    return false;
  }
  override onDestruction(player: Player) {
    player.match.gameResult.setWinnerByDestruction(player);
  }
}
