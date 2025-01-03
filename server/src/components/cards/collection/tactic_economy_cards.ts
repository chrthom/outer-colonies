import { CardType, InterventionType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { spliceCardById } from '../../utils/helpers';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class EconomyTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Trade;
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
    this.drawSpecificCard(player, c => c.type == CardType.Hull);
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

export class Card217 extends EconomyTacticCard {
  private readonly cardsToRestore = 3;
  constructor() {
    super(217, 'Schrottsammler', 2);
  }
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack, optionalParameters?: number[]) {
    optionalParameters?.map(cardId => spliceCardById(player.discardPile, cardId)).forEach(c => player.deck.push(c));
    player.shuffleDeck();
  }
  getValidTargets(player: Player): CardStack[] {
    return player.discardPile.length > 0 ? this.onlyColonyTarget(player.cardStacks) : [];
  }
  override onEnterGameSelectableCardOptions(player: Player): number[] | undefined {
    return player.discardPile.map(c => c.id);
  }
  override onEnterGameNumberOfSelectableCardOptions(player: Player): number {
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
    let foundCards = 0;
    for (let i = 0; i < player.deck.length; i++) {
      if (player.deck[i].type == CardType.Infrastructure) {
        player.takeCards(player.deck.splice(i, 1));
        if (++foundCards == this.cardsToDraw) break;
      }
    }
    player.shuffleDeck();
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}
