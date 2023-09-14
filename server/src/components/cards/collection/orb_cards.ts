import { TacticDiscipline } from "../../config/enums";
import Player from "../../game_state/player";
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
      [ TacticDiscipline.Economy ]
    );
  }
  override onStartTurn(player: Player): void {
    this.additionalCardWhenDrawing(TacticDiscipline.Intelligence, player);
  }
  override onEndTurn(): void {}
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
    this.additionalCardWhenDrawing(TacticDiscipline.Science, player);
  }
  override onEndTurn(): void {}
}