import Player from "../../game_state/player";
import InfrastructureCard from "../types/infrastructure_card";

abstract class CardPowerPlant extends InfrastructureCard {
    constructor(id: number) {
        super(
            id, 
            'Kraftwerk',
            {
                energy: 4,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: 0
            }
        )
        this.onlyAttachableToColony = true;
    }
    immediateEffect(_: Player) {}
}

export class Card185 extends CardPowerPlant {
    constructor() {
        super(185)
    }
}

export class Card242 extends CardPowerPlant {
    constructor() {
        super(242)
    }
}

export class Card350 extends CardPowerPlant {
    constructor() {
        super(350)
    }
}

export class Card453 extends CardPowerPlant {
    constructor() {
        super(453)
    }
}