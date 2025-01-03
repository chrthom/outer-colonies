import { CardSubtype, CardType } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import Card, { CardRarity } from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';

export default abstract class OrbCard extends Card {
  private actionPoolCardTypes!: CardSubtype[][];
  constructor(
    id: number,
    name: string,
    rarity: CardRarity,
    profile: CardProfileConfig,
    ...actionPool: CardSubtype[][]
  ) {
    super(id, name, CardType.Orb, rarity, profile);
    this.actionPoolCardTypes = actionPool;
  }
  getValidTargets(player: Player): CardStack[] {
    return player.actionPool.includesAllOf(player.originalActions)
      ? player.cardStacks.filter(cs => cs.type == CardType.Colony)
      : [];
  }
  onEnterGame(player: Player): void {
    player.colonyCardStack.cardStacks.filter(c => c.type == CardType.Orb).forEach(c => c.discard());
    this.addToActionPool(player);
  }
  onLeaveGame(player: Player): void {
    this.removeFromActionPool(player);
  }
  override onEndTurn(): void {}
  override canBeRetracted(): boolean {
    return false;
  }
  override get isColonyDefense(): boolean {
    return true;
  }
  override get actionPool(): ActionPool {
    return new ActionPool(...this.actionPoolCardTypes.map(ct => new CardAction(...ct)));
  }
}
