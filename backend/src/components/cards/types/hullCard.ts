import Card from '../card';
import CardProfile from '../card_profile';
import CardStack from '../card_stack';
import Match from '../../game_state/match'
import { CardType } from '../../config/oc_enums';

export default abstract class HullCard extends Card {
    readonly multipart!: HullMultipart;
    readonly hullProfile!: HullProfile;
    constructor(id: number, name: string, multipart: HullMultipart, profile: HullProfile) {
        super(id, name, CardType.Hull);
        this.multipart = multipart;
        this.hullProfile = profile;
    }
    canBeAttachedTo(cardStacks: Array<CardStack>): Array<CardStack> {
        return cardStacks.filter((cs: CardStack) =>
            cs.card.type == CardType.Hull 
                && (<HullCard> cs.card).multipart.neededParts.indexOf(this.id)
                && cs.attachedCards.filter((c: CardStack) => c.card.name == this.name)); // TODO: Rethink if matching by name is a good idea
    }
    canBeAttachedToColony(cardStacks: Array<CardStack>): boolean {
        return this.hullProfile.energy >= 0 ? true : false;
    }
    isPlayableDecorator(match: Match, playerNo: number): boolean {
        return true;
    }
    profile(): CardProfile {
        return <CardProfile> this.hullProfile;
        /*
        return {
            hp: this.hullProfile.hp,
            speed: this.hullProfile.speed,
            energy: this.hullProfile.energy,
            theta: this.hullProfile.theta,
            xi: this.hullProfile.xi,
            phi: this.hullProfile.phi,
            omega: this.hullProfile.omega,
            delta: this.hullProfile.delta,
            psi: this.hullProfile.psi,
        }
        */
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