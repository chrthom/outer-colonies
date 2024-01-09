import Card from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';
import { CardType } from '../../../shared/config/enums';
import Player from '../../game_state/player';

export default abstract class HullCard extends Card {
  readonly multipart!: HullMultipart;
  constructor(
    id: number,
    name: string,
    rarity: number,
    multipart: HullMultipart,
    profile?: CardProfileConfig
  ) {
    super(id, name, CardType.Hull, rarity, profile);
    this.multipart = multipart;
  }
  getValidTargets(player: Player): CardStack[] {
    return this.filterAttachableHull(player.cardStacks).concat(
      this.filterAttachableColony(player.cardStacks)
    );
  }
  private filterAttachableHull(cardStacks: CardStack[]): CardStack[] {
    return cardStacks
      .filter(cs => cs.type == CardType.Hull) // Only attachable to other hull cards
      .filter(cs => (<HullCard>cs.card).multipart.neededPartIds.includes(this.id)) // Hull card hav to be required by card stack
      .filter(
        // Either duplicates are allowed or is not duplicated
        cs => (<HullCard>cs.card).multipart.duplicatesAllowed || !cs.cards.some(c => c.name == this.name)
      )
      .filter(cs => cs.profile.combine(this.profile).isValid); // Sufficient sockets and energy available
  }
  private filterAttachableColony(cardStacks: CardStack[]): CardStack[] {
    return cardStacks.filter(cs => cs.type == CardType.Colony && this.profile.isValid);
  }
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
  override canBeRetracted(isRootCard: boolean): boolean {
    return isRootCard;
  }
  override isFlightReady(cards: Card[]): boolean {
    return cards.filter(c => c.type == CardType.Hull).length == this.multipart.numberOfRequiredParts;
  }
}

export interface HullMultipart {
  numberOfRequiredParts: number;
  neededPartIds: number[];
  duplicatesAllowed: boolean;
}
