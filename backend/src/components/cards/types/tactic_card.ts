import { CardType } from "../../config/enums";
import Card from "../card";
import CardProfile from "../card_profile";
import CardStack from "../card_stack";

export default abstract class TacticCard extends Card {
    constructor(id: number, name: string, playableOutsideBuildPhase: boolean, staysInPlay: boolean) {
        super(id, name, CardType.Tactic);
        this.playableOutsideBuildPhase = playableOutsideBuildPhase;
        this.staysInPlay = staysInPlay;
    }
    profile(): CardProfile {
        return new CardProfile();
    }
    protected onlyColonyTarget(cardStacks): CardStack[] {
        return cardStacks.filter(cs => cs.card.type == CardType.Colony);
    }
}
