import { CardType } from "../../config/enums";
import Card from "../card";
import CardProfile, { InfrastructureProfile } from "../card_profile";
import CardStack from "../card_stack";

export default abstract class InfrastructureCard extends Card {
    readonly infrastructureProfile!: InfrastructureProfile;
    onlyAttachableToColony: boolean = false;
    constructor(id: number, name: string, profile: InfrastructureProfile) {
        super(id, name, CardType.Infrastructure);
        this.infrastructureProfile = profile;
    }
    filterValidAttachTargets(cardStacks: CardStack[]): CardStack[] {
        return cardStacks
            .filter(cs => (!this. onlyAttachableToColony && cs.type() == CardType.Hull) || cs.type() == CardType.Colony)
            .filter(cs => cs.profileMatches(this.profile()));
    }
    profile(): CardProfile {
        return CardProfile.fromInfrastructureProfile(this.infrastructureProfile);
    }
}