import EquipmentCard from '../types/equipment_card';

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
