import Card from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';
import { CardType } from '../../config/enums';
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
    return cardStacks.filter(
      cs =>
        cs.type == CardType.Hull &&
        (<HullCard>cs.card).multipart.neededPartIds.includes(this.id) &&
        !cs.cards.some(c => c.name == this.name)
    ); // Reconsider if matching by name is a bad idea
  }
  private filterAttachableColony(cardStacks: CardStack[]): CardStack[] {
    return cardStacks.filter(cs => cs.type == CardType.Colony && this.profile.energy >= 0);
  }
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
  override canBeRetracted(isRootCard: boolean): boolean {
    return isRootCard;
  }
  override isFlightReady(cards: Card[]): boolean {
    return cards.filter(c => c.type == CardType.Hull).length == this.multipart.partNo;
  }
}

export class HullMultipart {
  partNo!: number;
  neededPartIds!: number[];
  static noMultipart: HullMultipart = {
    partNo: 1,
    neededPartIds: []
  };
}
