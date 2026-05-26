import { CardSubtype, CardType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import Card, { CardRarity } from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';
import ActionPool, { CardAction } from '../action_pool';

/**
 * Base class for all infrastructure cards.
 */
export default abstract class InfrastructureCard extends Card {
  constructor(id: number, name: string, rarity: CardRarity, profile?: CardProfileConfig) {
    super(id, name, CardType.Infrastructure, rarity, profile);
  }

  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks
      .filter(cs => (!this.onlyAttachableToColony && cs.type == CardType.Hull) || cs.type == CardType.Colony)
      .filter(cs => cs.profileMatches(this.profile));
  }

  protected get onlyAttachableToColony(): boolean {
    return false;
  }
}

/**
 * Abstract base class for infrastructure cards that add actions to the action pool.
 * Handles the lifecycle of adding/removing actions when entering/leaving the game.
 */
export abstract class ActionInfrastructureCard extends InfrastructureCard {
  private actionPoolCardTypes!: CardSubtype[][];

  constructor(
    id: number,
    name: string,
    rarity: CardRarity,
    profile: CardProfileConfig,
    ...actionPool: CardSubtype[][]
  ) {
    super(id, name, rarity, profile);
    this.actionPoolCardTypes = actionPool;
  }

  /**
   * Called when the card enters the game. Adds its actions to the player's action pool.
   */
  onEnterGame(player: Player) {
    this.addToActionPool(player);
  }

  /**
   * Called when the card leaves the game. Removes its actions from the player's action pool.
   */
  onLeaveGame(player: Player) {
    this.removeFromActionPool(player);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onStartTurn(player: Player, cardStack: CardStack) {}

  onEndTurn() {}

  /**
   * Gets the action pool containing this card's actions.
   */
  override get actionPool(): ActionPool {
    return new ActionPool(...this.actionPoolCardTypes.map(ct => new CardAction(...ct)));
  }
}

/**
 * Abstract base class for utility infrastructure cards.
 * Provides empty implementations for lifecycle methods that can be overridden as needed.
 */
export abstract class InfrastructureUtilCard extends InfrastructureCard {
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
}

/**
 * Abstract base class for defense infrastructure cards.
 * These cards are typically attachable only to colonies and provide defensive benefits.
 */
export abstract class InfrastructureDefenseCard extends InfrastructureCard {
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}

  override get isColonyDefense(): boolean {
    return true;
  }

  protected override get onlyAttachableToColony(): boolean {
    return true;
  }
}
