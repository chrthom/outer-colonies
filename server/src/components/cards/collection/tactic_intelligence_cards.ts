import { CardType, InterventionType, TacticDiscipline } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class IntelligenceTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Intelligence;
  }
}

export class Card129 extends IntelligenceTacticCard {
  constructor() {
    super(129, 'Frühwarnsystem', 3);
  }
  onEnterGame(player: Player, target: CardStack) {
    this.onEnterGameAttackIntervention(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    const colony = this.onlyColonyTarget(player.cardStacks);
    return this.getValidTargetsInterventionAttack(player, i => i.target.uuid == colony[0].uuid);
  }
  override adjustedAttackDamageByIntervention(damage: number): number {
    return Math.round(damage / 2);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.Attack;
  }
}

export class Card176 extends IntelligenceTacticCard {
  private readonly countersDisciplines = [TacticDiscipline.Intelligence, TacticDiscipline.Military];
  constructor() {
    super(176, 'Gegenspionage', 1);
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

export class Card231 extends IntelligenceTacticCard {
  removeActions: CardAction[] = [CardType.Hull, CardType.Equipment].map(ct => new CardAction(ct));
  constructor() {
    super(231, 'Unruhen schüren', 2);
  }
  onEnterGame(player: Player) {
    this.getOpponentPlayer(player).actionPool.remove(...this.removeActions);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.isActivePlayer ? [] : this.onlyColonyTarget(this.getOpponentPlayer(player).cardStacks);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.OpponentTurnStart;
  }
}
