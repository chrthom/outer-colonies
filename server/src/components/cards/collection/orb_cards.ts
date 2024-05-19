import { CardType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import CardStack from '../card_stack';
import OrbCard from '../types/orb_card';

export class Card112 extends OrbCard {
  constructor() {
    super(
      112,
      'Titan',
      4,
      {
        armour: 1
      },
      [CardType.Hull, CardType.Infrastructure]
    );
  }
  override onStartTurn() {}
  override get instantRecharge(): boolean {
    return true;
  }
}

export class Card146 extends OrbCard {
  constructor() {
    super(146, 'Europa', 2, {}, [TacticDiscipline.Science]);
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Intelligence);
  }
}

export class Card159 extends OrbCard {
  constructor() {
    super(159, 'Ganymed', 2, {}, [TacticDiscipline.Intelligence]);
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Trade);
  }
}

export class Card225 extends OrbCard {
  constructor() {
    super(
      225,
      'Ceres',
      2,
      {
        handCardLimit: -1
      },
      [TacticDiscipline.Trade]
    );
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Trade);
  }
}

export class Card301 extends OrbCard {
  constructor() {
    super(301, 'Io', 5, {
      energy: 6,
      pointDefense: 1
    });
  }
  override onStartTurn() {}
  override get instantRecharge(): boolean {
    return true;
  }
}

export class Card317 extends OrbCard {
  constructor() {
    super(317, 'Kallisto', 3, {}, [TacticDiscipline.Military]);
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, CardType.Equipment);
  }
}

export class Card403 extends OrbCard {
  constructor() {
    super(403, 'Pluto', 5, {}, [CardType.Equipment, CardType.Hull, CardType.Infrastructure, CardType.Tactic]);
  }
  override getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.some(cs => cs.card.name == 'Solarpanele') ? [] : super.getValidTargets(player);
  }
  override onStartTurn() {}
}

export class Card410 extends OrbCard {
  constructor() {
    super(410, 'Miranda', 4, {
      armour: 1
    });
  }
  override onStartTurn(player: Player) {
    this.additionalCardWhenDrawing(player, TacticDiscipline.Military);
  }
  override get instantRecharge(): boolean {
    return true;
  }
}

export class Card432 extends OrbCard {
  constructor() {
    super(432, 'Oberon', 2, {}, [CardType.Equipment]);
  }
  override onStartTurn() {}
}

export class Card433 extends OrbCard {
  constructor() {
    super(433, 'Triton', 2, {}, [CardType.Hull]);
  }
  override getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.some(cs => cs.zone == Zone.Colony && cs.card.name == 'Solarpanele')
      ? []
      : super.getValidTargets(player);
  }
  override onStartTurn() {}
}
