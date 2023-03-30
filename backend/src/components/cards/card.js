class Card {
    constructor(id, name, type) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
}

class HullCard extends Card {
    constructor(id, name, multipart, profile) {
        super(id, name, 'hull');
        this.multipart = multipart;
        this.profile = profile;
    }
}

class HullProfile {
    constructor(hp, speed, energy, theta, xi, phi, omega, delta, psi) {
        this.hp = hp;
        this.speed = speed;
        this.energy = energy;
        this.theta = theta;
        this.xi = xi;
        this.phi = phi;
        this.omega = omega;
        this.delta = delta;
        this.psi = psi;
    }
}

class HullMultipart {
    constructor(partNo, neededParts) {
        this.partNo = partNo;
        this.neededParts = neededParts;
    }
}

class EquipmentCard extends Card {
    constructor(id, name, profile, attackProfile) {
        super(id, name, 'equipment');
        this.profile = profile;
        this.attackProfile = attackProfile;
    }
}

class EquipmentProfile {
    constructor() {
        
    }
}

module.exports = {
    HullCard,
    HullProfile,
    HullMultipart
};
