import { CardType, TacticDiscipline, Zone } from "../../config/enums";
import Player from "../../game_state/player";
import CardStack from "../card_stack";
import OrbCard from "../types/orb_card";

export class Card146 extends OrbCard {
  constructor() {
    super(
      146,
      'Europa',
      2,
      {
        energy: 0,
        hp: 0,
        speed: 0,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: 0
      },
      [ TacticDiscipline.Science ]
    );
  }
  override onStartTurn(player: Player): void {
    this.additionalCardWhenDrawing(TacticDiscipline.Intelligence, player);
  }
}

export class Card159 extends OrbCard {
  constructor() {
    super(
      159,
      'Ganymed',
      2,
      {
        energy: 0,
        hp: 0,
        speed: 0,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: 0
      },
      [ TacticDiscipline.Intelligence ]
    );
  }
  override onStartTurn(player: Player): void {
    this.additionalCardWhenDrawing(TacticDiscipline.Economy, player);
  }
}

export class Card317 extends OrbCard {
  constructor() {
    super(
      317,
      'Kallisto',
      3,
      {
        energy: 0,
        hp: 0,
        speed: 0,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: 0
      },
      [ TacticDiscipline.Military ]
    );
  }
  override onStartTurn(player: Player): void {
    this.additionalCardWhenDrawing(CardType.Equipment, player);
  }
}

export class Card403 extends OrbCard {
  constructor() {
    super(
      403,
      'Pluto',
      5,
      {
        energy: 0,
        hp: 0,
        speed: 0,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: 0
      },
      [ CardType.Equipment, CardType.Hull, CardType.Infrastructure, CardType.Tactic ]
    );
  }
  override getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.some(cs => cs.card.name == 'Solarpanele') ? [] : super.getValidTargets(player);
  }
  override onStartTurn(): void {}
}

export class Card432 extends OrbCard {
  constructor() {
    super(
      432,
      'Oberon',
      2,
      {
        energy: 0,
        hp: 0,
        speed: 0,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: 0
      },
      [ CardType.Equipment ]
    );
  }
  override onStartTurn(): void {}
}

export class Card433 extends OrbCard {
  constructor() {
    super(
      433,
      'Triton',
      2,
      {
        energy: 0,
        hp: 0,
        speed: 0,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: 0,
        psi: 0
      },
      [ CardType.Hull ]
    );
  }
  override getValidTargets(player: Player): CardStack[] {
    return player.cardStacks.some(cs => cs.zone == Zone.Colony && cs.card.name == 'Solarpanele') ? [] : super.getValidTargets(player);
  }
  override onStartTurn(): void {}
}
