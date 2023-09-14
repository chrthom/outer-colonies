import { CardSubtype, CardType, TacticDiscipline } from '../../config/enums';
import { rules } from '../../config/rules';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import Card from '../card';
import CardProfile, { OrbProfile } from '../card_profile';
import CardStack from '../card_stack';
import TacticCard from './tactic_card';

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
  onEnterGame(player: Player): void {
    player.getColonyCardStack().cardStacks.filter(c => c.type == CardType.Orb).forEach(c => c.discard());
    this.addToActionPool(player);
  }
  onLeaveGame(player: Player): void {
    this.removeFromActionPool(player);
  }
  override onEndTurn(): void {}
  get profile(): CardProfile {
    return CardProfile.fromOrbProfile(this.orbProfile);
  }
  override get actionPool(): ActionPool {
    return new ActionPool(...this.actionPoolCardTypes.map(ct => new CardAction(...ct)));
  }
  protected additionalCardWhenDrawing(cardType: CardSubtype, player: Player) {
    const relevantCardDrawn = this.getDrawnCards(player).some(c =>
      c.type == cardType || this.isTacticDiscipline(cardType) && c.type == CardType.Tactic && (c as TacticCard).discipline == cardType
    );
    if (relevantCardDrawn) player.drawCards(1);
  }
  private isTacticDiscipline(cardType: CardSubtype): boolean {
    return Object.values(TacticDiscipline).map(td => <CardSubtype> td).includes(cardType);
  }
  private getDrawnCards(player: Player) {
    return player.hand.slice(-rules.cardsToDrawPerTurn).map(c => c.card);
  }
}
