import Card from '../card';
import CardProfile from '../card_profile';
import CardStack from '../card_stack';
import Match from '../../game_state/match'
import { CardType } from '../../config/enums';

export default abstract class HullCard extends Card {
    readonly multipart!: HullMultipart;
    readonly hullProfile!: HullProfile;
    constructor(id: number, name: string, multipart: HullMultipart, profile: HullProfile) {
        super(id, name, CardType.Hull);
        this.multipart = multipart;
        this.hullProfile = profile;
    }
    filterValidAttachTargets(cardStacks: Array<CardStack>): Array<CardStack> {
        return this.filterAttachableHull(cardStacks).concat(this.filterAttachableColony(cardStacks));
    }
    private filterAttachableHull(cardStacks: Array<CardStack>): Array<CardStack> {
        return cardStacks.filter(cs =>
            cs.card.type == CardType.Hull 
                && (<HullCard> cs.card).multipart.neededParts.includes(this.id)
                && cs.attachedCards.filter(c => c.card.name == this.name).length == 0); // TODO: Rethink if matching by name is a good idea
    }
    private filterAttachableColony(cardStacks: Array<CardStack>): Array<CardStack> {
        return cardStacks.filter(cs => 
            cs.card.type == CardType.Colony 
                && this.hullProfile.energy >= 0);
    }
    isPlayableDecorator(match: Match, playerNo: number): boolean {
        return true;
    }
    profile(): CardProfile {
        return <CardProfile> this.hullProfile; // TODO: Check if this works properly
    }
}

export class HullProfile {
    readonly hp: number = 0;
    readonly speed: number = 0;
    readonly energy: number = 0;
    readonly theta: number = 0;
    readonly xi: number = 0;
    readonly phi: number = 0;
    readonly omega: number = 0;
    readonly delta: number = 0;
    readonly psi: number = 0;
}

export class HullMultipart {
    partNo!: number;
    neededParts!: Array<number>;
    static noMultipart: HullMultipart = {
        partNo: 1,
        neededParts: []
    };
}