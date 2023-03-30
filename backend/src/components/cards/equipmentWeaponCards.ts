import { EquipmentCard } from './card';

export class Card166 extends EquipmentCard {
    constructor() {
        super(
            166, 
            'Laserkanone',
            {
                energy: 0,
                hp: 0,
                speed: 0,
                pointDefense: 0,
                shield: 0,
                armour: 0,
                theta: 1,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: 0
            },
            {
                range: 2,
                damage: 3,
                pointDefense: 0,
                shield: 3,
                armour: 1
            }
        )
    }
}
