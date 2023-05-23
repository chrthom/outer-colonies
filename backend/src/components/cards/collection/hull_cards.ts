import HullCard from '../types/hull_card';
import { HullMultipart } from '../types/hull_card';

export class Card160 extends HullCard {
    constructor() {
        super(
            160, 
            'Leichter Frachter', 
            HullMultipart.noMultipart, 
            {
                hp: 5,
                speed: 4,
                energy: 0,
                theta: 1,
                xi: 0,
                phi: 0,
                omega: 1,
                delta: 1,
                psi: 1
            }
        )
    }
}

export class Card348 extends HullCard {
    constructor() {
        super(
            348, 
            'Kanonenboot',
            HullMultipart.noMultipart,
            {
                hp: 5,
                speed: 2,
                energy: 0,
                theta: 0,
                xi: 1,
                phi: 0,
                omega: 1,
                delta: 0,
                psi: 0
            }
        )
    }
}
