import { CardSubtype, CardType } from '../../config/enums';
import { rules } from '../../config/rules';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import Card from '../card';
import CardProfile, { OrbProfile } from '../card_profile';
import CardStack from '../card_stack';

export default abstract class OrbCard extends Card {
  readonly orbProfile!: OrbProfile;
  private actionPoolCardTypes!: CardSubtype[][];
  constructor(
    id: number,
    name: string,
    rarity: number,
    profile: OrbProfile,
    ...actionPool: CardSubtype[][]
  ) {
    super(id, name, CardType.Orb, rarity);
    this.orbProfile = profile;
    this.actionPoolCardTypes = actionPool;
  }
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.type == CardType.Colony);
  }
  onUtilizaton(player: Player): void {
    this.addToActionPool(player);
  }
  onRetraction(player: Player): void {
    this.removeFromActionPool(player);
  }
  get profile(): CardProfile {
    return CardProfile.fromOrbProfile(this.orbProfile);
  }
  override get actionPool(): ActionPool {
    return new ActionPool(...this.actionPoolCardTypes.map(ct => new CardAction(...ct)));
  }
  protected getDrawnCards(player: Player) {
    return player.hand.slice(-rules.cardsToDrawPerTurn).map(c => c.card);
  }
}
