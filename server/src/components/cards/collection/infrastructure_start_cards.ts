import { CardType, TacticDiscipline } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import InfrastructureCard from '../types/infrastructure_card';

abstract class InfrastructureStartOfTurnCard extends InfrastructureCard {
  onEnterGame() {}
  onLeaveGame() {}
  onEndTurn() {}
}

export class Card230 extends InfrastructureStartOfTurnCard {
  constructor() {
    super(230, 'Verwaltungsbüros', 2, {
      energy: -2,
      psi: -2
    });
  }
  onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, CardType.Infrastructure);
  }
}

export class Card333 extends InfrastructureStartOfTurnCard {
  constructor() {
    super(333, 'Marsianisches Konsulat', 2, {
      energy: -1,
      psi: -1
    });
  }
  onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Intelligence, TacticDiscipline.Military);
  }
}

export class Card435 extends InfrastructureStartOfTurnCard {
  constructor() {
    super(435, 'Gewerbegebiet', 2, {
      energy: -1,
      psi: -1
    });
  }
  onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Science, TacticDiscipline.Trade);
  }
}
