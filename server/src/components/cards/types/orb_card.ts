import { CardType } from '../../config/enums';
import Player from '../../game_state/player';
import Card from '../card';
import CardProfile, { OrbProfile } from '../card_profile';
import CardStack from '../card_stack';

export default abstract class OrbCard extends Card {
  readonly orbProfile!: OrbProfile;
  constructor(id: number, name: string, rarity: number, profile?: OrbProfile) {
    super(id, name, CardType.Orb, rarity);
    this.orbProfile = profile;
  }
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.type == CardType.Colony);
  }
  get profile(): CardProfile {
    return CardProfile.fromOrbProfile(this.orbProfile);
  }
  // TODO: Continue here!
}
