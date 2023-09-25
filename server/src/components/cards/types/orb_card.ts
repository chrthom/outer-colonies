import { CardSubtype, CardType, TacticDiscipline } from '../../../shared/config/enums';
import { rules } from '../../../shared/config/rules';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import Card from '../card';
import { CardProfileConfig } from '../card_profile';
import CardStack from '../card_stack';
import TacticCard from './tactic_card';

export default abstract class OrbCard extends Card {
  private actionPoolCardTypes!: CardSubtype[][];
  constructor(
    id: number,
    name: string,
    rarity: number,
    profile: CardProfileConfig,
    ...actionPool: CardSubtype[][]
  ) {
    super(id, name, CardType.Orb, rarity, profile);
    this.actionPoolCardTypes = actionPool;
  }
  getValidTargets(player: Player): CardStack[] {
    return player.colonyCardStack.cardStacks.some(c => c.card.id == this.id) ||
      player.actionPool.toString() != player.originalActions.toString()
      ? []
      : player.cardStacks.filter(cs => cs.type == CardType.Colony);
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
  override get actionPool(): ActionPool {
    return new ActionPool(...this.actionPoolCardTypes.map(ct => new CardAction(...ct)));
  }
  protected additionalCardWhenDrawing(cardType: CardSubtype, player: Player) {
    const relevantCardDrawn = this.getDrawnCards(player).some(
      c =>
        c.type == cardType ||
        (this.isTacticDiscipline(cardType) &&
          c.type == CardType.Tactic &&
          (c as TacticCard).discipline == cardType)
    );
    if (relevantCardDrawn) player.drawCards(1);
  }
  private isTacticDiscipline(cardType: CardSubtype): boolean {
    return Object.values(TacticDiscipline)
      .map(td => <CardSubtype>td)
      .includes(cardType);
  }
  private getDrawnCards(player: Player) {
    return player.hand.slice(-rules.cardsToDrawPerTurn).map(c => c.card);
  }
}
