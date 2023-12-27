import { CardType, Intervention, TacticDiscipline, TurnPhase } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class MilitaryTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Military;
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
  override canIntervene(intervention: Intervention): boolean {
    return intervention == Intervention.BattleRoundEnd;
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

export class Card428 extends MilitaryTacticCard {
  private speedLimit = 2;
  constructor() {
    super(428, 'Ausmanövriert', 2);
  }
  onEnterGame(player: Player, target: CardStack) {
    target.cardStacks.forEach(cs => cs.attackAvailable = false);
  }
  getValidTargets(player: Player): CardStack[] {
    if (player.match.turnPhase != TurnPhase.Combat) return [];
    return player.match.battle.ships[player.match.getWaitingPlayerNo()]
      .filter(cs => cs.profile.speed <= this.speedLimit && cs.isInBattle);
  }
  override canIntervene(intervention: Intervention): boolean {
    return intervention == Intervention.BattleRoundStart;
  }
}
