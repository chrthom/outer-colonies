import { CardType, InterventionType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { pickRandom } from '../../utils/helpers';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

export class Card129 extends TacticCard {
  constructor() {
    super(129, 'Planetarer Verteidigungsplan', 3, TacticDiscipline.Military);
  }
  onEnterGame(player: Player, target: CardStack) {
    this.onEnterGameAttackIntervention(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    const targetUUIDs = player.cardStacks.filter(cs => cs.zone == Zone.Colony).map(cs => cs.uuid);
    return this.getValidTargetsInterventionAttack(player, i => targetUUIDs.includes(i.target.uuid));
  }
  override adjustedAttackDamageByIntervention(): number {
    return 0;
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.Attack;
  }
}

export class Card139 extends TacticCard {
  private readonly deactivations = 4;
  constructor() {
    super(139, 'ECM-Emitter', 2, TacticDiscipline.Military);
  }
  onEnterGame(player: Player) {
    this.deactivatePointDefense(player.match.battle.ships[player.match.waitingPlayerNo], this.deactivations);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.match.battle.ships[player.match.waitingPlayerNo].filter(
      cs =>
        cs.isInBattle &&
        cs.type == CardType.Hull &&
        cs.cardStacks.some(scs => scs.card.profile.pointDefense && scs.defenseAvailable)
    );
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundStart;
  }
  private deactivatePointDefense(targets: CardStack[], remainingDeactivations: number) {
    const pd2 = this.getPointDefense(targets, 2);
    const pd1 = this.getPointDefense(targets, 1);
    if (remainingDeactivations >= 2 && pd2) {
      pd2.defenseAvailable = false;
      this.deactivatePointDefense(targets, remainingDeactivations - 2);
    } else if (remainingDeactivations && pd1) {
      pd1.defenseAvailable = false;
      this.deactivatePointDefense(targets, remainingDeactivations - 1);
    }
  }
  private getPointDefense(targets: CardStack[], level: number): CardStack | undefined {
    return targets
      .flatMap(cs => cs.cardStacks)
      .find(cs => cs.defenseAvailable && cs.card.profile.pointDefense == level);
  }
}

export class Card173 extends TacticCard {
  constructor() {
    super(173, 'Ausweichmanöver', 1, TacticDiscipline.Military);
  }
  onEnterGame(player: Player, target: CardStack) {
    this.onEnterGameAttackIntervention(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getValidTargetsInterventionAttack(player, i => i.target.profile.speed >= 3);
  }
  override adjustedAttackDamageByIntervention(): number {
    return 0;
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.Attack;
  }
}

export class Card174 extends TacticCard {
  private readonly damageToRepair = 8;
  constructor() {
    super(174, 'Feldreperaturen', 1, TacticDiscipline.Military);
  }
  onEnterGame(player: Player, target: CardStack) {
    target.damage -= Math.min(this.damageToRepair, target.damage);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.type == CardType.Hull && cs.damage > 0);
  }
}

export class Card319 extends TacticCard {
  constructor() {
    super(319, 'Zusatztorpedos', 2, TacticDiscipline.Military);
  }
  onEnterGame(player: Player, target: CardStack) {
    target.cardStacks.filter(cs => cs.card.profile.phi).forEach(cs => (cs.attackAvailable = true));
  }
  getValidTargets(player: Player): CardStack[] {
    return player.match.battle.ships[player.no].filter(
      cs =>
        cs.isInBattle &&
        cs.type == CardType.Hull &&
        cs.cardStacks.some(scs => scs.card.profile.phi && !scs.attackAvailable)
    );
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundStart;
  }
}

export class Card331 extends TacticCard {
  private readonly damageToRepair = 3;
  constructor() {
    super(331, 'Schadenskontrolle', 2, TacticDiscipline.Military);
  }
  onEnterGame(player: Player, target: CardStack) {
    target.damage -= Math.min(this.damageToRepair, target.damage);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.type == CardType.Hull && cs.damage > 0);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundEnd;
  }
}

export class Card334 extends TacticCard {
  constructor() {
    super(
      334,
      'Planetare Invasion',
      2,
      TacticDiscipline.Military,
      {},
      {
        range: 0,
        damage: 10,
        pointDefense: -4,
        shield: 0,
        armour: 0
      }
    );
  }
  onEnterGame(player: Player, target: CardStack) {
    this.attackByTactic(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.match.battle.range == 1
      ? this.onlyColonyTarget(this.getOpponentPlayer(player).cardStacks)
      : [];
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundEnd;
  }
}

export class Card337 extends TacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(CardType.Equipment),
    new CardAction(CardType.Hull)
  );
  constructor() {
    super(337, 'Militärpioniere', 1, TacticDiscipline.Military);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card338 extends TacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(338, 'Nachschub', 1, TacticDiscipline.Military);
  }
  onEnterGame(player: Player) {
    player.drawCards(this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card346 extends TacticCard {
  private readonly countersDisciplines = [TacticDiscipline.Military, TacticDiscipline.Trade];
  constructor() {
    super(346, 'Space Marines', 1, TacticDiscipline.Military);
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

export class Card419 extends TacticCard {
  private speedLimitation = 3;
  constructor() {
    super(
      419,
      'Kritischer Treffer',
      2,
      TacticDiscipline.Military,
      {},
      {
        range: 0,
        damage: 8,
        pointDefense: 4,
        shield: 0,
        armour: 0
      }
    );
  }
  onEnterGame(player: Player, target: CardStack) {
    this.attackByTactic(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getOpponentPlayer(player).cardStacks.filter(
      cs => cs.type == CardType.Hull && cs.profile.speed <= this.speedLimitation
    );
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundEnd;
  }
}

export class Card428 extends TacticCard {
  private readonly speedLimit = 2;
  constructor() {
    super(428, 'Ausmanövriert', 2, TacticDiscipline.Military);
  }
  onEnterGame(player: Player, target: CardStack) {
    target.cardStacks.forEach(cs => (cs.attackAvailable = false));
  }
  getValidTargets(player: Player): CardStack[] {
    return player.match.battle.ships[player.match.waitingPlayerNo].filter(
      cs => cs.profile.speed <= this.speedLimit && cs.isInBattle && cs.type == CardType.Hull
    );
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundStart;
  }
}

export class Card501 extends TacticCard {
  constructor() {
    super(
      501,
      'Nukleare Apokalypse',
      5,
      TacticDiscipline.Military,
      {},
      {
        range: 0,
        damage: 24,
        pointDefense: -5,
        shield: -3,
        armour: -4
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

export class Card504 extends TacticCard {
  constructor() {
    super(
      504,
      'Interplanetares Geschütz',
      4,
      TacticDiscipline.Military,
      {},
      {
        range: 0,
        damage: 28,
        pointDefense: 0,
        shield: 0,
        armour: 6
      }
    );
  }
  onEnterGame(player: Player, target: CardStack) {
    this.attackByTactic(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getOpponentPlayer(player).cardStacks.filter(
      cs => cs.zone == Zone.Orbital && cs.profile.speed == 0
    );
  }
}

export class Card531 extends TacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(531, 'Umbau ziviler Werften', 2, TacticDiscipline.Military);
  }
  onEnterGame(player: Player) {
    this.drawSpecificCards(player, c => c.type == CardType.Hull, this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card532 extends TacticCard {
  constructor() {
    super(
      532,
      'Angriffsdrohnengeschwader',
      2,
      TacticDiscipline.Military,
      {},
      {
        range: 0,
        damage: 5,
        pointDefense: 0,
        shield: 0,
        armour: -3
      }
    );
  }
  onEnterGame(player: Player, target: CardStack) {
    this.attackByTactic(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.match.battle.ships[player.match.waitingPlayerNo];
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundStart;
  }
}

export class Card533 extends TacticCard {
  constructor() {
    super(
      533,
      'Kamikaze-Drohnengeschwader',
      2,
      TacticDiscipline.Military,
      {},
      {
        range: 0,
        damage: 8,
        pointDefense: -4,
        shield: 0,
        armour: -4
      }
    );
  }
  onEnterGame(player: Player, target: CardStack) {
    this.attackByTactic(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.match.battle.ships[player.match.waitingPlayerNo];
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundStart;
  }
}

export class Card550 extends TacticCard {
  private readonly cardsToDiscard = 2;
  constructor() {
    super(550, 'Nachschublinien überfallen', 1, TacticDiscipline.Military);
  }
  onEnterGame(player: Player) {
    const p = this.getOpponentPlayer(player);
    for (let i = 0; i < this.cardsToDiscard; i++) {
      if (p.hand) {
        p.discardHandCards(pickRandom(p.hand).uuid);
      }
    }
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(this.getOpponentPlayer(player).cardStacks);
  }
}
