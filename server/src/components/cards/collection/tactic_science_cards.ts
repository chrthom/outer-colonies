import { CardType, TacticDiscipline, CardDurability, InterventionType } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { spliceCardById, spliceCardStackByUUID } from '../../utils/helpers';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class ScienceTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Science;
  }
}

export class Card108 extends ScienceTacticCard {
  constructor() {
    super(
      108,
      'Asteroideneinschlag',
      4,
      {},
      {
        range: 0,
        damage: 15,
        pointDefense: -3,
        shield: 0,
        armour: -3
      }
    );
  }
  onEnterGame(player: Player, target: CardStack) {
    this.attackByTactic(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(this.getOpponentPlayer(player).cardStacks);
  }
}

export class Card110 extends ScienceTacticCard {
  private readonly damageToRepair = 3;
  constructor() {
    super(110, 'Nanobot Wolke', 4);
  }
  onEnterGame(player: Player) {
    player.cardStacks
      .filter(cs => cs.type == CardType.Hull)
      .forEach(cs => {
        const numOfHullCards = cs.cards.filter(c => c.type == CardType.Hull).length;
        cs.damage -= Math.min(this.damageToRepair * numOfHullCards, cs.damage);
      });
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card143 extends ScienceTacticCard {
  private readonly oneTimeActionPool = new ActionPool(new CardAction(CardType.Equipment));
  constructor() {
    super(143, 'Waffenprototyp', 2);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
    this.drawSpecificCards(player, c => c.type == CardType.Equipment, 1);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card144 extends ScienceTacticCard {
  constructor() {
    super(144, 'Kalte Fusion', 2, {
      energy: 1
    });
  }
  override get durability(): CardDurability {
    return CardDurability.Permanent;
  }
  override get isAttachSelfManaging(): boolean {
    return true;
  }
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack) {
    let attachCard: CardStack | undefined;
    if (target.type == CardType.Colony) attachCard = player.hand.find(cs => cs.card.name == 'Kraftwerk');
    attachCard ??= player.hand.find(cs => cs.card.name == 'Fusionsreaktor');
    if (attachCard) {
      spliceCardStackByUUID(player.hand, attachCard.uuid);
      attachCard.playHandCard(target);
      attachCard.attach(cardStack);
    }
  }
  getValidTargets(player: Player): CardStack[] {
    const validTargetsWithDuplicates = player.hand
      .filter(cs => cs.card.name == 'Fusionsreaktor' || cs.card.name == 'Kraftwerk')
      .flatMap(cs => cs.card.getValidTargets(player));
    return [...new Map(validTargetsWithDuplicates.map(cs => [cs.uuid, cs])).values()];
  }
}

export class Card162 extends ScienceTacticCard {
  constructor() {
    super(162, 'Schildüberladung', 1, {
      shield: 2
    });
  }
  override get durability(): CardDurability {
    return CardDurability.Turn;
  }
  onEnterGame() {}
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.type == CardType.Hull && cs.profile.shield > 0);
  }
}

export class Card229 extends ScienceTacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(229, 'Bodenproben', 2);
  }
  onEnterGame(player: Player) {
    this.drawSpecificCards(player, c => c.type == CardType.Infrastructure, this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card233 extends ScienceTacticCard {
  private readonly activations = 4;
  constructor() {
    super(233, 'ABM-KI', 1);
  }
  onEnterGame(player: Player, target: CardStack) {
    this.activatePointDefense(target, this.activations);
    this.onEnterGameAttackIntervention(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getValidTargetsInterventionAttack(player, i =>
      i.target.cardStacks.some(cs => cs.card.profile.pointDefense && !cs.defenseAvailable)
    );
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.Attack;
  }
  private activatePointDefense(target: CardStack, remainingActivations: number) {
    const pd2 = this.getPointDefense(target, 2);
    const pd1 = this.getPointDefense(target, 1);
    if (remainingActivations >= 2 && pd2) {
      pd2.defenseAvailable = true;
      this.activatePointDefense(target, remainingActivations - 2);
    } else if (remainingActivations && pd1) {
      pd1.defenseAvailable = true;
      this.activatePointDefense(target, remainingActivations - 1);
    }
  }
  private getPointDefense(target: CardStack, level: number): CardStack | undefined {
    return target.cardStacks.find(cs => !cs.defenseAvailable && cs.card.profile.pointDefense == level);
  }
}

export class Card316 extends ScienceTacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(TacticDiscipline.Military),
    new CardAction(TacticDiscipline.Military),
    new CardAction(TacticDiscipline.Military),
    new CardAction(TacticDiscipline.Military)
  );
  constructor() {
    super(316, 'Militärforschung', 3);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card324 extends ScienceTacticCard {
  constructor() {
    super(324, 'Überladene Triebwerke', 2, {
      speed: 1
    });
  }
  override get durability(): CardDurability {
    return CardDurability.Turn;
  }
  onEnterGame() {}
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.type == CardType.Hull && cs.profile.speed > 0);
  }
}

export class Card335 extends ScienceTacticCard {
  constructor() {
    super(335, 'Schilddämpfer', 2);
  }
  onEnterGame(player: Player, target: CardStack) {
    target.cardStacks.filter(cs => cs.card.profile.shield).forEach(cs => (cs.defenseAvailable = false));
  }
  getValidTargets(player: Player): CardStack[] {
    return player.match.battle.ships[player.match.waitingPlayerNo].filter(
      cs =>
        cs.isInBattle &&
        cs.type == CardType.Hull &&
        cs.cardStacks.some(scs => scs.card.profile.shield && scs.defenseAvailable)
    );
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundStart;
  }
}

export class Card404 extends ScienceTacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(CardType.Tactic),
    new CardAction(CardType.Tactic)
  );
  constructor() {
    super(404, 'Universelle KI', 5);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
    this.drawSpecificCards(player, c => c.type == CardType.Tactic, 1);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card414 extends ScienceTacticCard {
  private readonly requiredAttachedEquipmentCards = 2;
  constructor() {
    super(414, 'Fehlfunktion', 3);
  }
  onEnterGame(player: Player, target: CardStack) {
    this.onEnterGameAttackIntervention(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getValidTargetsInterventionAttack(
      player,
      i =>
        i.src.rootCardStack.cards.filter(c => c.type == CardType.Equipment).length >=
        this.requiredAttachedEquipmentCards
    );
  }
  override adjustedAttackDamageByIntervention(): number {
    return 0;
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.Attack;
  }
}

export class Card423 extends ScienceTacticCard {
  private readonly cardsToChooseFrom = 7;
  constructor() {
    super(423, 'Wissenschaftlicher Durchbruch', 2);
  }
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack, optionalParameters?: number[]) {
    // TODO: Unifiy in one method - make sure to limit number of cards, print warning if no card found
    optionalParameters
      ?.map(cardId => spliceCardById(player.deck, cardId))
      .forEach(c => (c ? player.takeCard(c) : {}));
    player.shuffleDeck();
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
  override onEnterGameSelectableCardOptions(player: Player): number[] | undefined {
    return player.deck.slice(0, this.cardsToChooseFrom).map(c => c.id);
  }
  override onEnterGameNumberOfSelectableCardOptions(): number {
    return 1;
  }
}

export class Card429 extends ScienceTacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(CardType.Equipment),
    new CardAction(CardType.Infrastructure),
    new CardAction(CardType.Infrastructure)
  );
  constructor() {
    super(429, 'Futuristische Industrie', 2);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card443 extends ScienceTacticCard {
  private readonly countersDisciplines = [TacticDiscipline.Intelligence, TacticDiscipline.Science];
  constructor() {
    super(443, 'Computer-Virus', 1);
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
