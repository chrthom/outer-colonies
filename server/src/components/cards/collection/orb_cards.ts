import { CardType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import CardStack from '../card_stack';
import OrbCard from '../types/orb_card';

export class Card112 extends OrbCard {
  constructor() {
    super(112, 'Titan', 4, {
      armour: 1
    }, [CardType.Hull, CardType.Infrastructure]);
  }
  override onStartTurn(): void {}
  override get instantRecharge(): boolean {
    return true;
  }
}

export class Card146 extends OrbCard {
  constructor() {
    super(146, 'Europa', 2, {}, [TacticDiscipline.Science]);
  }
  override onStartTurn(player: Player): void {
    this.additionalCardWhenDrawing(TacticDiscipline.Intelligence, player);
  }
}

export class Card159 extends OrbCard {
  constructor() {
    super(159, 'Ganymed', 2, {}, [TacticDiscipline.Intelligence]);
  }
  override onStartTurn(player: Player): void {
    this.additionalCardWhenDrawing(TacticDiscipline.Trade, player);
  }
}

export class Card301 extends OrbCard {
  constructor() {
    super(301, 'Io', 5, {
      energy: 6,
      pointDefense: 1
    });
  }
  override onStartTurn(): void {}
  override get instantRecharge(): boolean {
    return true;
  }
}

export class Card317 extends OrbCard {
  constructor() {
    super(317, 'Kallisto', 3, {}, [TacticDiscipline.Military]);
  }
  override onStartTurn(player: Player): void {
    this.additionalCardWhenDrawing(CardType.Equipment, player);
  }
}

export class Card403 extends OrbCard {
  constructor() {
    super(403, 'Pluto', 5, {}, [CardType.Equipment, CardType.Hull, CardType.Infrastructure, CardType.Tactic]);
  }
  override getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.some(cs => cs.card.name == 'Solarpanele') ? [] : super.getValidTargets(player);
  }
  override onStartTurn(): void {}
}

export class Card410 extends OrbCard {
  constructor() {
    super(410, 'Miranda', 4, {
      armour: 1
    });
  }
  override onStartTurn(player: Player): void {
    this.additionalCardWhenDrawing(TacticDiscipline.Military, player);
  }
  override get instantRecharge(): boolean {
    return true;
  }
}

export class Card432 extends OrbCard {
  constructor() {
    super(432, 'Oberon', 2, {}, [CardType.Equipment]);
  }
  override onStartTurn(): void {}
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
  override onStartTurn(): void {}
}
