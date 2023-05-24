import EquipmentCard from '../types/equipment_card';

export class Card163 extends EquipmentCard {
    constructor() {
        super(
            163, 
            'Verbundpanzerung',
            1,
            {
                energy: 0,
                hp: 2,
                speed: 0,
                pointDefense: 0,
                shield: 0,
                armour: 1,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: -1,
                delta: 0,
                psi: 0
            },
            false
        )
    }
}

export class Card170 extends EquipmentCard {
    constructor() {
        super(
            170,
            'Strahlenschilde',
            1,
            {
                energy: 0,
                hp: 0,
                speed: 0,
                pointDefense: 0,
                shield: 1,
                armour: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: -1,
                delta: 0,
                psi: 0
            },
            true
        )
    }
}
