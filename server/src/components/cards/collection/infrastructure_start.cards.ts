import { CardType, TacticDiscipline } from '../../config/enums';
import { rules } from '../../config/rules';
import Player from '../../game_state/player';
import InfrastructureCard from '../types/infrastructure_card';
import TacticCard from '../types/tactic_card';

abstract class InfrastructureStartOfTurnCard extends InfrastructureCard {
  onUtilizaton() {}
  onRetraction() {}
  onEndTurn() {}
  protected getDrawnCards(player: Player) {
    return player.hand.slice(-rules.cardsToDrawPerTurn).map(c => c.card);
  }
}

export class Card230 extends InfrastructureStartOfTurnCard {
  constructor() {
    super(230, 'Verwaltungsbüros', 2, {
      energy: -2,
      hp: 0,
      speed: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 0,
      delta: 0,
      psi: -2,
      handCardLimit: 0
    });
  }
  onStartTurn(player: Player) {
    const relevantCardDrawn = this.getDrawnCards(player).some(c => c.type == CardType.Infrastructure);
    if (relevantCardDrawn) player.drawCards(1);
  }
}

export class Card333 extends InfrastructureStartOfTurnCard {
  constructor() {
    super(333, 'Marsianisches Konsulat', 2, {
      energy: -1,
      hp: 0,
      speed: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 0,
      delta: 0,
      psi: -1,
      handCardLimit: 0
    });
  }
  onStartTurn(player: Player) {
    const relevantCardDrawn = this.getDrawnCards(player)
      .filter(c => c.type == CardType.Tactic)
      .map(c => <TacticCard>c)
      .some(c => c.discipline == TacticDiscipline.Military || c.discipline == TacticDiscipline.Intelligence);
    if (relevantCardDrawn) player.drawCards(1);
  }
}

export class Card435 extends InfrastructureStartOfTurnCard {
  constructor() {
    super(435, 'Gewerbegebiet', 2, {
      energy: -1,
      hp: 0,
      speed: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 0,
      delta: 0,
      psi: -1,
      handCardLimit: 0
    });
  }
  onStartTurn(player: Player) {
    const relevantCardDrawn = this.getDrawnCards(player)
      .filter(c => c.type == CardType.Tactic)
      .map(c => <TacticCard>c)
      .some(c => c.discipline == TacticDiscipline.Economy || c.discipline == TacticDiscipline.Science);
    if (relevantCardDrawn) player.drawCards(1);
  }
}
