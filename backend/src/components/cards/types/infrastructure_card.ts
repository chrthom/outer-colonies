import { CardType, Zone } from "../../config/enums";
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
        const colonyProfile = cardStacks
            .filter(cs => cs.zone == Zone.Colony)
            .filter(cs => [ CardType.Colony, CardType.Orb, CardType.Infrastructure ].includes(cs.card.type))
            .map(cs => cs.profile())
            .reduce((a, b) => CardProfile.combineCardProfiles(a, b));
        const combinedProfile = CardProfile.combineCardProfiles(colonyProfile, this.profile());
        const colony = cardStacks
            .filter(cs => cs.card.type == CardType.Colony)
            .filter(_ => CardProfile.isValid(combinedProfile));
        const ships = this.onlyAttachableToColony ? [] : 
            cardStacks.filter(cs => cs.card.type == CardType.Hull && cs.profileMatches(this.profile()));
        return colony.concat(ships);
    }
    profile(): CardProfile {
        return CardProfile.fromInfrastructureProfile(this.infrastructureProfile);
    }
}