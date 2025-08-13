import { CardType, InterventionType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { removeFirstMatchingElement, spliceCardById, spliceFrom } from '../../utils/helpers';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class EconomyTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Trade;
  }
}

export class Card123 extends EconomyTacticCard {
  private readonly cardsToDiscard = 2;
  constructor() {
    super(123, 'Handelsabkommen', 3);
  }
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack, optionalParameters?: number[]) {
    if (optionalParameters && optionalParameters[0]) {
      const card = spliceFrom(player.deck, c => c.id == optionalParameters[0]);
      if (card) {
        player.discardCards(...player.pickCardsFromDeck(this.cardsToDiscard));
        player.shuffleDeck();
        player.deck.unshift(card);
      } else console.log(`WARN: No card found for optional parameter when playing card '${this.name}'`);
    }
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
  override onEnterGameSelectableCardOptions(player: Player): number[] | undefined {
    return player.deck.filter(c => c.type != CardType.Orb).map(c => c.id);
  }
  override onEnterGameNumberOfSelectableCardOptions(): number {
    return 1;
  }
}

export class Card141 extends EconomyTacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(CardType.Equipment),
    new CardAction(CardType.Hull),
    new CardAction(CardType.Infrastructure)
  );
  constructor() {
    super(141, 'Externe Arbeitskräfte', 2);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card142 extends EconomyTacticCard {
  private readonly oneTimeActionPool = new ActionPool(new CardAction(CardType.Hull));
  constructor() {
    super(142, 'Ingenieure von Phobos', 2);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
    this.drawSpecificCards(player, c => c.type == CardType.Hull, 1);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card165 extends EconomyTacticCard {
  private readonly cardsToDrawPerPsiSocket = 1;
  constructor() {
    super(165, 'Konvoi', 1);
  }
  onEnterGame(player: Player) {
    const freePsiSockets = this.calcFreePsiSockets(player);
    if (freePsiSockets) {
      player.drawCards(freePsiSockets * this.cardsToDrawPerPsiSocket);
    }
  }
  getValidTargets(player: Player): CardStack[] {
    return this.calcFreePsiSockets(player) > 0 ? this.onlyColonyTarget(player.cardStacks) : [];
  }
  private calcFreePsiSockets(player: Player): number {
    return player.cardStacks
      .filter(cs => cs.zone == Zone.Orbital)
      .map(cs => cs.profile)
      .filter(p => p.speed >= 2 && p.psi > 0)
      .map(p => p.psi)
      .reduce((psi1, psi2) => psi1 + psi2, 0);
  }
}

export class Card210 extends EconomyTacticCard {
  private readonly cardsToDraw = 4;
  constructor() {
    super(210, 'Schwarzmarkthandel', 4);
  }
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack, optionalParameters?: number[]) {
    if (optionalParameters && optionalParameters[0]) {
      // TODO: Unify in tribute method - Make sure to limit number of cards, print warning if no card found
      const handCardUUID = player.hand.find(cs => cs.card.id == optionalParameters[0])?.uuid;
      if (handCardUUID) {
        player.discardHandCards(handCardUUID);
        this.drawSpecificCards(player, c => c.type == CardType.Equipment, this.cardsToDraw);
        player.shuffleDeck();
      } else console.log(`WARN: No card found for optional parameter when playing card '${this.name}'`);
    }
  }
  getValidTargets(player: Player): CardStack[] {
    return player.hand.length > 1 ? this.onlyColonyTarget(player.cardStacks) : [];
  }
  override onEnterGameSelectableCardOptions(player: Player): number[] | undefined {
    return removeFirstMatchingElement(player.hand.slice(), cs => cs.card.id == this.id).map(c => c.card.id);
  }
  override onEnterGameNumberOfSelectableCardOptions(): number {
    return 1;
  }
}

export class Card217 extends EconomyTacticCard {
  private readonly cardsToRestore = 3;
  constructor() {
    super(217, 'Schrottsammler', 2);
  }
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack, optionalParameters?: number[]) {
    // TODO: Make sure to limit number of cards, print warning if no card found
    optionalParameters
      ?.map(cardId => spliceCardById(player.discardPile, cardId))
      .filter(c => !!c)
      .forEach(c => player.deck.push(c));
    player.shuffleDeck();
  }
  getValidTargets(player: Player): CardStack[] {
    return player.discardPile.length > 0 ? this.onlyColonyTarget(player.cardStacks) : [];
  }
  override onEnterGameSelectableCardOptions(player: Player): number[] | undefined {
    return player.discardPile.map(c => c.id);
  }
  override onEnterGameNumberOfSelectableCardOptions(): number {
    return this.cardsToRestore;
  }
}

export class Card232 extends EconomyTacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(232, 'Warenlieferung', 1);
  }
  onEnterGame(player: Player) {
    player.drawCards(this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card235 extends EconomyTacticCard {
  constructor() {
    super(235, 'Blindgänger', 1);
  }
  onEnterGame(player: Player, target: CardStack) {
    this.onEnterGameAttackIntervention(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getValidTargetsInterventionAttack(player, i => i.src.profile.phi < 0);
  }
  override adjustedAttackDamageByIntervention(): number {
    return 0;
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.Attack;
  }
}

export class Card236 extends EconomyTacticCard {
  private readonly countersDisciplines = [TacticDiscipline.Science, TacticDiscipline.Trade];
  constructor() {
    super(236, 'Handelsembargo', 1);
  }
  onEnterGame(player: Player) {
    this.onEnterGameInterventionTacticCard(player);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getValidTargetsInterventionTacticCard(player, this.countersDisciplines);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.TacticCard;
  }
}

export class Card321 extends EconomyTacticCard {
  private readonly cardsToRestore = 6;
  constructor() {
    super(321, 'Recycling', 2);
  }
  onEnterGame(player: Player) {
    player.deck.push(...player.pickCardsFromTopOfDiscardPile(this.cardsToRestore));
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card427 extends EconomyTacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(427, 'Immigranten von der Erde', 2);
  }
  onEnterGame(player: Player) {
    this.drawSpecificCards(player, c => c.type == CardType.Infrastructure, this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}
