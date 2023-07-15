import { CardType, TacticDiscipline } from "../../config/enums";
import Player from "../../game_state/player";
import Card from "../card";
import CardProfile from "../card_profile";
import CardStack from "../card_stack";

export default abstract class TacticCard extends Card {
  constructor(
    id: number,
    name: string,
    rarity: number,
    playableOutsideBuildPhase: boolean,
    staysInPlay: boolean,
  ) {
    super(id, name, CardType.Tactic, rarity);
    this.playableOutsideBuildPhase = playableOutsideBuildPhase;
    this.staysInPlay = staysInPlay;
  }
  onRetraction() {}
  onStartTurn() {}
  onEndTurn() {}
  canBeRetracted(): boolean {
    return false;
  }
  profile(): CardProfile {
    return new CardProfile();
  }
  abstract get discipline(): TacticDiscipline;
  protected onlyColonyTarget(playersCardStacks: CardStack[]): CardStack[] {
    return playersCardStacks.filter((cs) => cs.card.type == CardType.Colony);
  }
}
