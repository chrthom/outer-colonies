export default class CardProfile implements HullProfile, EquipmentProfile, InfrastructureProfile {
    pointDefense: number = 0;
    shield: number = 0;
    armour: number = 0;
    hp: number = 0;
    speed: number = 0;
    energy: number = 0;
    theta: number = 0;
    xi: number = 0;
    phi: number = 0;
    omega: number = 0;
    delta: number = 0;
    psi: number = 0;
    static fromBaseProfile(baseProfile: BaseProfile): CardProfile {
        return <CardProfile> baseProfile;
    }
    static fromEquipmentProfile(equipmentProfile: EquipmentProfile): CardProfile {
        return <CardProfile> equipmentProfile;
    }
    static fromHullProfile(hullProfile: HullProfile): CardProfile {
        return <CardProfile> hullProfile;
    }
    static fromInfrastructureProfile(infrastructureProfile: InfrastructureProfile): CardProfile {
        return <CardProfile> infrastructureProfile;
    }
    static combineCardProfiles(c1: CardProfile, c2: CardProfile): CardProfile {
        return {
            hp: c1.hp + c2.hp,
            speed: c1.speed + c2.speed,
            energy: c1.energy + c2.energy,
            theta: c1.theta + c2.theta,
            xi: c1.xi + c2.xi,
            phi: c1.phi + c2.phi,
            omega: c1.omega + c2.omega,
            delta: c1.delta + c2.delta,
            psi: c1.psi + c2.psi,
            pointDefense: c1.pointDefense + c2.pointDefense,
            shield: c1.shield + c2.shield,
            armour: c1.armour + c2.armour
        }
    }
    static isValid(c: CardProfile): boolean {
        return Object.values(c).filter(v => v < 0).length == 0;
    }
}

export interface BaseProfile {
    hp: number;
    speed: number;
    energy: number;
    theta: number;
    xi: number;
    phi: number;
    omega: number;
    delta: number;
    psi: number;
}

export interface HullProfile extends BaseProfile {}

export interface InfrastructureProfile extends BaseProfile {}

export interface EquipmentProfile extends BaseProfile {
    pointDefense: number;
    shield: number;
    armour: number;
}

export interface AttackProfile {
    range: number;
    damage: number;
    pointDefense: number;
    shield: number;
    armour: number;
}
