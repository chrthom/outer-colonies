import { CardStack } from "../card_stack";

export abstract class Card {
    readonly id!: number;
    readonly name!: string;
    readonly type!: CardType;
    constructor(id: number, name: string, type: CardType) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
    abstract canBeAttachedTo(cardStacks: Array<CardStack>): Array<CardStack>
    abstract canBeAttachedToColony(cardStacks: Array<CardStack>): boolean
    abstract profile(): CardProfile
}

export enum CardType {
    Hull = 'hull',
    Equipment = 'equipment',
    Colony = 'colony',
    Tactic = 'tactic',
    Orb = 'orb'
}

export abstract class HullCard extends Card {
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

export abstract class EquipmentCard extends Card {
    readonly equipmentProfile!: EquipmentProfile;
    readonly attackProfile?: AttackProfile;
    constructor(id: number, name: string, profile: EquipmentProfile, attackProfile?: AttackProfile) {
        super(id, name, CardType.Equipment);
        this.equipmentProfile = profile;
        this.attackProfile = attackProfile;
    }
    canBeAttachedTo(cardStacks: Array<CardStack>): Array<CardStack> {
        return cardStacks.filter((cs: CardStack) => 
            cs.card.type == CardType.Hull 
            && cs.profileMatches(this.profile()));
    }
    canBeAttachedToColony(cardStacks: Array<CardStack>): boolean {
        return false;
    }
    profile(): CardProfile {
        return <CardProfile> this.equipmentProfile;
    }
}

export class EquipmentProfile extends HullProfile {
    readonly pointDefense: number = 0;
    readonly shield: number = 0;
    readonly armour: number = 0;
}

export class AttackProfile {
    readonly range: number;
    readonly damage: number;
    readonly pointDefense: number;
    readonly shield: number;
    readonly armour: number;
}

export class CardProfile extends EquipmentProfile {}