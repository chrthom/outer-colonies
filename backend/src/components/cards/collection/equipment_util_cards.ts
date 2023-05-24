import EquipmentCard from '../types/equipment_card';

abstract class NuclearReactorCard extends EquipmentCard {
    constructor(id: number) {
        super(
            id, 
            'Atomreaktor',
            0,
            {
                energy: 2,
                hp: 0,
                speed: 0,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: -1,
                delta: 0,
                psi: 0
            },
            false
        );
    }
}

export class Card109 extends EquipmentCard {
    constructor() {
        super(
            109, 
            'Plasmanachbrenner',
            4,
            {
                energy: -3,
                hp: 0,
                speed: 2,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: -1,
                psi: 0
            },
            false
        );
    }
}

export class Card145 extends EquipmentCard {
    constructor() {
        super(
            145, 
            'Fusionsreaktor',
            2,
            {
                energy: 4,
                hp: 0,
                speed: 0,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: -2,
                delta: 0,
                psi: 0
            },
            false
        );
    }
}

export class Card161 extends EquipmentCard {
    constructor() {
        super(
            161, 
            'Ionenschubdüsen',
            1,
            {
                energy: -1,
                hp: 0,
                speed: 1,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: -1,
                psi: 0
            },
            false
        );
    }
}

export class Card187 extends NuclearReactorCard {
    constructor() {
        super(187);
    }
}

export class Card244 extends NuclearReactorCard {
    constructor() {
        super(244);
    }
}

export class Card352 extends NuclearReactorCard {
    constructor() {
        super(352);
    }
}

export class Card434 extends EquipmentCard {
    constructor() {
        super(
            434, 
            'Leichtbauweise',
            2,
            {
                energy: 0,
                hp: -3,
                speed: 1,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: -1,
                psi: 0
            },
            false
        );
    }
}

export class Card449 extends EquipmentCard {
    constructor() {
        super(
            449, 
            'Schwerer Rumpf',
            1,
            {
                energy: 0,
                hp: 5,
                speed: -1,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: -1,
                psi: 0
            },
            false
        );
    }
}

export class Card451 extends NuclearReactorCard {
    constructor() {
        super(451);
    }
}
