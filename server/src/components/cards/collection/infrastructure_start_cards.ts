import { CardType, TacticDiscipline } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import InfrastructureCard from '../types/infrastructure_card';

export class Card230 extends InfrastructureCard {
  constructor() {
    super(230, 'Verwaltungsbüros', 2, {
      energy: -1,
      psi: -2
    });
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, CardType.Infrastructure);
  }
}

export class Card344 extends InfrastructureCard {
  constructor() {
    super(344, 'Marsianisches Konsulat', 1, {
      energy: -1,
      psi: -1
    });
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Intelligence, TacticDiscipline.Military);
  }
}

export class Card448 extends InfrastructureCard {
  constructor() {
    super(448, 'Gewerbegebiet', 1, {
      energy: -1,
      psi: -1
    });
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Science, TacticDiscipline.Trade);
  }
}

export const allCards = [new Card230(), new Card344(), new Card448()];
