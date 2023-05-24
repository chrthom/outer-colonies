import EquipmentCard from '../types/equipment_card';

export class Card130 extends EquipmentCard {
    constructor() {
        super(
            130, 
            'Flakartillerie',
            2,
            {
                energy: 0,
                hp: 0,
                speed: 0,
                pointDefense: 1,
                shield: 0,
                armour: 0,
                theta: 0,
                xi: -1,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: 0
            },
            true,
            {
                range: 2,
                damage: 3,
                pointDefense: 0,
                shield: 0,
                armour: -3
            }
        )
    }
}
