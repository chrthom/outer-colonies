abstract class Card {
    readonly id!: number;
    readonly name!: string;
    readonly type!: CardType;
    constructor(id: number, name: string, type: CardType) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
}

enum CardType {
    Hull, Equipment, Colony, Tactic, Orb
}

export abstract class HullCard extends Card {
    readonly multipart!: HullMultipart;
    readonly profile!: HullProfile;
    constructor(id: number, name: string, multipart: HullMultipart, profile: HullProfile) {
        super(id, name, CardType.Hull);
        this.multipart = multipart;
        this.profile = profile;
    }
}

export class HullProfile {
    readonly hp: number;
    readonly speed: number;
    readonly energy: number;
    readonly theta: number;
    readonly xi: number;
    readonly phi: number;
    readonly omega: number;
    readonly delta: number;
    readonly psi: number;
}

export class HullMultipart {
    partNo!: number;
    neededParts!: number;
    static noMultipart: HullMultipart = {
        partNo: 1,
        neededParts: 1
    };
}

export abstract class EquipmentCard extends Card {
    readonly profile!: EquipmentProfile;
    readonly attackProfile?: AttackProfile;
    constructor(id: number, name: string, profile: EquipmentProfile, attackProfile?: AttackProfile) {
        super(id, name, CardType.Equipment);
        this.profile = profile;
        this.attackProfile = attackProfile;
    }
}

export class EquipmentProfile {
    readonly energy: number;
    readonly hp: number;
    readonly speed: number;
    readonly pointDefense: number;
    readonly shield: number;
    readonly armour: number;
    readonly theta: number;
    readonly xi: number;
    readonly phi: number;
    readonly omega: number;
    readonly delta: number;
    readonly psi: number;
}

export class AttackProfile {
    readonly range: number;
    readonly damage: number;
    readonly pointDefense: number;
    readonly shield: number;
    readonly armour: number;
}

module.exports = {
    HullCard,
    HullProfile,
    HullMultipart,
    EquipmentCard,
    EquipmentProfile,
    AttackProfile
};
