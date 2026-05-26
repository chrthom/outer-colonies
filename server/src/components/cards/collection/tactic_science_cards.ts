import { CardType, TacticDiscipline, CardDurability, InterventionType } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { pickRandom, removeFirstMatchingElement, spliceCardStackByUUID } from '../../utils/helpers';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

export class Card108 extends TacticCard {
  constructor() {
    super(
      108,
      'Asteroideneinschlag',
      4,
      TacticDiscipline.Science,
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
    return this.onlyOpponentColonyTarget(player);
  }
}

export class Card110 extends TacticCard {
  private readonly damageToRepair = 3;
  constructor() {
    super(110, 'Nanobot Wolke', 4, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    player.cardStacks
      .filter(cs => cs.type == CardType.Hull)
      .forEach(cs => {
        const numOfHullCards = cs.cards.filter(c => c.type == CardType.Hull).length;
        this.repairDamage(cs, this.damageToRepair * numOfHullCards);
      });
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card143 extends TacticCard {
  private readonly oneTimeActionPool = new ActionPool(new CardAction(CardType.Equipment));
  constructor() {
    super(143, 'Waffenprototyp', 2, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
    this.drawSpecificCards(player, c => c.type == CardType.Equipment, 1);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card144 extends TacticCard {
  constructor() {
    super(144, 'Kalte Fusion', 2, TacticDiscipline.Science, {
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

export class Card162 extends TacticCard {
  constructor() {
    super(162, 'Schildüberladung', 1, TacticDiscipline.Science, {
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

export class Card229 extends TacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(229, 'Bodenproben', 2, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    this.drawSpecificCards(player, c => c.type == CardType.Infrastructure, this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card233 extends TacticCard {
  private readonly activations = 4;
  constructor() {
    super(233, 'ABM-KI', 1, TacticDiscipline.Science);
  }
  onEnterGame(player: Player, target: CardStack) {
    this.togglePointDefense([target], this.activations, true);
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
}

export class Card316 extends TacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(TacticDiscipline.Military),
    new CardAction(TacticDiscipline.Military),
    new CardAction(TacticDiscipline.Military),
    new CardAction(TacticDiscipline.Military)
  );
  constructor() {
    super(316, 'Militärforschung', 3, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card324 extends TacticCard {
  constructor() {
    super(324, 'Überladene Triebwerke', 2, TacticDiscipline.Science, {
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

export class Card335 extends TacticCard {
  constructor() {
    super(335, 'Schilddämpfer', 2, TacticDiscipline.Science);
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

export class Card404 extends TacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(CardType.Tactic),
    new CardAction(CardType.Tactic)
  );
  constructor() {
    super(404, 'Universelle KI', 5, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
    this.drawSpecificCards(player, c => c.type == CardType.Tactic, 1);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card414 extends TacticCard {
  private readonly requiredAttachedEquipmentCards = 2;
  constructor() {
    super(414, 'Fehlfunktion', 3, TacticDiscipline.Science);
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

export class Card423 extends TacticCard {
  private readonly cardsToChooseFrom = 7;
  constructor() {
    super(423, 'Wissenschaftlicher Durchbruch', 2, TacticDiscipline.Science);
  }
  onEnterGame(player: Player, target: CardStack, cardStack: CardStack, optionalParameters?: number[]) {
    this.tributeMultipleFromPile(optionalParameters, player.deck, c => player.takeCard(c));
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

export class Card429 extends TacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(CardType.Equipment),
    new CardAction(CardType.Infrastructure),
    new CardAction(CardType.Infrastructure)
  );
  constructor() {
    super(429, 'Futuristische Industrie', 2, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card443 extends TacticCard {
  private readonly countersDisciplines = [TacticDiscipline.Intelligence, TacticDiscipline.Science];
  constructor() {
    super(443, 'Computer-Virus', 1, TacticDiscipline.Science);
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

export class Card524 extends TacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(524, 'Prototypen Feldtest', 2, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    this.drawSpecificCards(player, c => c.type == CardType.Equipment, this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card525 extends TacticCard {
  private readonly cardsToDraw = 5;
  constructor() {
    super(525, 'Heureka!', 2, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    player.discardHandCards(...player.hand.map(h => h.uuid));
    player.drawCards(this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card526 extends TacticCard {
  private readonly oneTimeActionPool = new ActionPool(new CardAction(TacticDiscipline.Science));
  private readonly cardsToDraw = 3;
  constructor() {
    super(526, 'Forschungsexpedition', 2, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
    player.drawCards(this.cardsToDraw);
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

export class Card530 extends TacticCard {
  private readonly cardsToDiscard = 4;
  constructor() {
    super(530, 'Pandemie', 2, TacticDiscipline.Science);
  }
  onEnterGame(player: Player) {
    [player, this.getOpponentPlayer(player)].forEach(p => {
      for (let i = 0; i < this.cardsToDiscard; i++) {
        if (p.hand) {
          p.discardHandCards(pickRandom(p.hand).uuid);
        }
      }
    });
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export const allCards = [
  new Card108(),
  new Card110(),
  new Card143(),
  new Card144(),
  new Card162(),
  new Card229(),
  new Card233(),
  new Card316(),
  new Card324(),
  new Card335(),
  new Card404(),
  new Card414(),
  new Card423(),
  new Card429(),
  new Card443(),
  new Card524(),
  new Card525(),
  new Card526(),
  new Card530()
];
