import EquipmentCard from '../types/equipment_card';

export class Card163 extends EquipmentCard {
    constructor() {
        super(
            163, 
            'Verbundpanzerung',
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
