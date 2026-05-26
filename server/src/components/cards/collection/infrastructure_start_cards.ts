import { CardType, TacticDiscipline } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import InfrastructureCard from '../types/infrastructure_card';

export class Card230 extends InfrastructureCard {
  constructor() {
    super(230, 'Verwaltungsbüros', 2, {
      energy: -2,
      psi: -2
    });
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, CardType.Infrastructure);
  }
}

export class Card333 extends InfrastructureCard {
  constructor() {
    super(333, 'Marsianisches Konsulat', 2, {
      energy: -1,
      psi: -1
    });
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Intelligence, TacticDiscipline.Military);
  }
}

export class Card435 extends InfrastructureCard {
  constructor() {
    super(435, 'Gewerbegebiet', 2, {
      energy: -1,
      psi: -1
    });
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Science, TacticDiscipline.Trade);
  }
}

export const allCards = [new Card230(), new Card333(), new Card435()];
