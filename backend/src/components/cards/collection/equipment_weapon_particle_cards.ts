import EquipmentCard from '../types/equipment_card';

export class Card106 extends EquipmentCard {
    constructor() {
        super(
            106,
            'Tachyonlanze',
            5,
            {
                energy: -4,
                hp: 0,
                speed: 0,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: 0,
                xi: -2,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: 0
            },
            true,
            {
                range: 4,
                damage: 8,
                pointDefense: 0,
                shield: 5,
                armour: 1
            }
        )
    }
}

export class Card107 extends EquipmentCard {
    constructor() {
        super(
            107,
            'Partiekllanze',
            4,
            {
                energy: -2,
                hp: 0,
                speed: 0,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: 0,
                xi: -2,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: 0
            },
            true,
            {
                range: 3,
                damage: 7,
                pointDefense: 0,
                shield: 5,
                armour: 1
            }
        )
    }
}

export class Card207 extends EquipmentCard {
    constructor() {
        super(
            207,
            'Materiedesintegrator',
            4,
            {
                energy: 0,
                hp: 0,
                speed: 0,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: -1,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: 0
            },
            true,
            {
                range: 3,
                damage: 4,
                pointDefense: 0,
                shield: 99,
                armour: 2
            }
        )
    }
}
