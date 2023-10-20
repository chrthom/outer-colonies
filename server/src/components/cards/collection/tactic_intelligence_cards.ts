import { CardType, Intervention, TacticDiscipline } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class IntelligenceTacticCard extends TacticCard {
    get discipline(): TacticDiscipline {
      return TacticDiscipline.Intelligence;
    }
  }
  
  export class Card231 extends IntelligenceTacticCard {
    removeActions: CardAction[] = [
      CardType.Hull,
      CardType.Equipment
    ].map(ct => new CardAction(ct));
    constructor() {
      super(231, 'Unruhen schüren', 2);
    }
    onEnterGame(player: Player) {
      this.getOpponentPlayer(player).actionPool.remove(...this.removeActions);
    }
    getValidTargets(player: Player): CardStack[] {
      return this.onlyColonyTarget(this.getOpponentPlayer(player).cardStacks);
    }
    override canIntervene(intervention: Intervention): boolean {
      return intervention == Intervention.OpponentTurnStart;
    }
  }