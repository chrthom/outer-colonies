import { CardType } from '../../config/enums';
import Player from '../../game_state/player';
import Card from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';

export default abstract class InfrastructureCard extends Card {
  onlyAttachableToColony: boolean = false;
  constructor(id: number, name: string, rarity: number, profile?: CardProfileConfig) {
    super(id, name, CardType.Infrastructure, rarity, profile);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks
      .filter(cs => (!this.onlyAttachableToColony && cs.type == CardType.Hull) || cs.type == CardType.Colony)
      .filter(cs => cs.profileMatches(this.profile));
  }
}
