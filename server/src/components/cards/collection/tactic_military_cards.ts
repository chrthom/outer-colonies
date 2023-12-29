import { CardType, InterventionType, TacticDiscipline } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class MilitaryTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Military;
  }
}

export class Card173 extends MilitaryTacticCard {
  constructor() {
    super(173, 'Ausweichmanöver', 1);
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

export class Card174 extends MilitaryTacticCard {
  private readonly damageToRepair = 8;
  constructor() {
    super(174, 'Feldreperaturen', 1);
  }
  onEnterGame(player: Player, target: CardStack) {
    target.damage -= Math.min(this.damageToRepair, target.damage);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.filter(cs => cs.type == CardType.Hull && cs.damage > 0);
  }
}

export class Card331 extends MilitaryTacticCard {
  private readonly damageToRepair = 3;
  constructor() {
    super(331, 'Schadenskontrolle', 2);
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

export class Card337 extends MilitaryTacticCard {
  private oneTimeActionPool = new ActionPool(
    new CardAction(CardType.Equipment),
    new CardAction(CardType.Hull)
  );
  constructor() {
    super(337, 'Militärpioniere', 1);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card338 extends MilitaryTacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(338, 'Nachschub', 1);
  }
  onEnterGame(player: Player) {
    player.drawCards(this.cardsToDraw);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card346 extends MilitaryTacticCard {
  private readonly countersDisciplines = [TacticDiscipline.Military, TacticDiscipline.Trade];
  constructor() {
    super(346, 'Space Marines', 1);
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

export class Card428 extends MilitaryTacticCard {
  private speedLimit = 2;
  constructor() {
    super(428, 'Ausmanövriert', 2);
  }
  onEnterGame(player: Player, target: CardStack) {
    target.cardStacks.forEach(cs => (cs.attackAvailable = false));
  }
  getValidTargets(player: Player): CardStack[] {
    return player.match.battle.ships[player.match.getWaitingPlayerNo()].filter(
      cs => cs.profile.speed <= this.speedLimit && cs.isInBattle && cs.type == CardType.Hull
    );
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundStart;
  }
}
