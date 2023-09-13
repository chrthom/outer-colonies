import { CardType, TacticDiscipline } from "../../config/enums";
import Player from "../../game_state/player";
import OrbCard from "../types/orb_card";
import TacticCard from "../types/tactic_card";

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
    const relevantCardDrawn = this.getDrawnCards(player).some(c =>
      c.type == CardType.Tactic && (c as TacticCard).discipline == TacticDiscipline.Intelligence
    );
    if (relevantCardDrawn) player.drawCards(1);
  }
  override onEndTurn(): void {}
}