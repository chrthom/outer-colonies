import { CardType } from '../../config/enums';
import { rules } from '../../config/rules';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import Card from '../card';
import CardProfile from '../card_profile';
import CardStack from '../card_stack';

export default class ColonyCard extends Card {
  constructor() {
    super(0, 'Colony', CardType.Colony, 0);
  }
  getValidTargets(): CardStack[] {
    return [];
  }
  onUtilizaton() {}
  onRetraction() {}
  onStartTurn() {}
  onEndTurn() {}
  get profile(): CardProfile {
    return {
      energy: 0,
      hp: rules.colonyHP,
      speed: 0,
      pointDefense: 0,
      shield: 0,
      armour: 0,
      theta: 0,
      xi: 99,
      phi: 99,
      omega: 99,
      delta: 99,
      psi: 99,
      handCardLimit: rules.maxHandCards
    };
  }
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
