import { CardType, InterventionType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { removeFirstMatchingElement, spliceCardById, spliceFrom } from '../../utils/helpers';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

export class Card123 extends TacticCard {
  private readonly cardsToDiscard = 2;
  constructor() {
    super(123, 'Handelsabkommen', 3, TacticDiscipline.Trade);
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

export class Card141 extends TacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(CardType.Equipment),
    new CardAction(CardType.Hull),
    new CardAction(CardType.Infrastructure)
  );
  constructor() {
    super(141, 'Externe Arbeitskräfte', 2, TacticDiscipline.Trade);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card142 extends TacticCard {
  private readonly oneTimeActionPool = new ActionPool(new CardAction(CardType.Hull));
  constructor() {
    super(142, 'Ingenieure von Phobos', 2, TacticDiscipline.Trade);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
    this.drawSpecificCards(player, c => c.type == CardType.Hull, 1);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card165 extends TacticCard {
  private readonly cardsToDrawPerPsiSocket = 1;
  constructor() {
    super(165, 'Konvoi', 1, TacticDiscipline.Trade);
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

export class Card210 extends TacticCard {
  private readonly cardsToDraw = 4;
  constructor() {
    super(210, 'Schwarzmarkthandel', 4, TacticDiscipline.Trade);
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

export class Card217 extends TacticCard {
  private readonly cardsToRestore = 3;
  constructor() {
    super(217, 'Schrottsammler', 2, TacticDiscipline.Trade);
  }
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack, optionalParameters?: number[]) {
    optionalParameters
      ?.map(cardId => spliceCardById(player.discardPile, cardId))
      .forEach(c => (c ? player.deck.push(c) : {}));
    player.shuffleDeck();
  }
  getValidTargets(player: Player): CardStack[] {
    return player.discardPile.length > 0 ? this.onlyColonyTarget(player.cardStacks) : [];
  }
  override onEnterGameSelectableCardOptions(player: Player): number[] | undefined {
    return player.discardPile.map(c => c.id);
  }
  override onEnterGameNumberOfSelectableCardOptions(player: Player): number {
    return Math.min(this.cardsToRestore, player.discardPile.length);
  }
}

export class Card232 extends TacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(232, 'Warenlieferung', 1, TacticDiscipline.Trade);
  }
  onEnterGame(player: Player) {
    player.drawCards(this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card235 extends TacticCard {
  constructor() {
    super(235, 'Blindgänger', 1, TacticDiscipline.Trade);
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

export class Card236 extends TacticCard {
  private readonly countersDisciplines = [TacticDiscipline.Science, TacticDiscipline.Trade];
  constructor() {
    super(236, 'Handelsembargo', 1, TacticDiscipline.Trade);
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

export class Card321 extends TacticCard {
  private readonly cardsToRestore = 6;
  constructor() {
    super(321, 'Recycling', 2, TacticDiscipline.Trade);
  }
  onEnterGame(player: Player) {
    player.deck.push(...player.pickCardsFromTopOfDiscardPile(this.cardsToRestore));
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card427 extends TacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(427, 'Immigranten von der Erde', 2, TacticDiscipline.Trade);
  }
  onEnterGame(player: Player) {
    this.drawSpecificCards(player, c => c.type == CardType.Infrastructure, this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card509 extends TacticCard {
  constructor() {
    super(509, 'Zahn der Zeit', 4, TacticDiscipline.Trade);
  }
  onEnterGame(player: Player, target: CardStack) {
    target.retract();
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyOpponentHullTarget(player);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.OpponentTurnStart;
  }
}

export class Card534 extends TacticCard {
  private readonly cardsToDiscard = 5;
  constructor() {
    super(534, 'Feindliche Übernahme', 2, TacticDiscipline.Trade);
  }
  onEnterGame(player: Player) {
    this.getOpponentPlayer(player).discardCards(
      ...this.getOpponentPlayer(player).pickCardsFromDeck(this.cardsToDiscard)
    );
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyOpponentColonyTarget(player);
  }
}

export class Card542 extends TacticCard {
  private readonly cardsToDrawPlayer = 3;
  private readonly cardsToDrawOpponent = 1;
  constructor() {
    super(542, 'Freihandelsabkommen', 1, TacticDiscipline.Trade);
  }
  onEnterGame(player: Player) {
    player.drawCards(this.cardsToDrawPlayer);
    this.getOpponentPlayer(player).drawCards(this.cardsToDrawOpponent);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export const allCards = [
  new Card123(),
  new Card141(),
  new Card142(),
  new Card165(),
  new Card210(),
  new Card217(),
  new Card232(),
  new Card235(),
  new Card236(),
  new Card321(),
  new Card427(),
  new Card509(),
  new Card534(),
  new Card542()
];
