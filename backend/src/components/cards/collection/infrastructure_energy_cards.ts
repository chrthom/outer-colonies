import { BattleType, TurnPhase } from "../../config/enums";
import Player from "../../game_state/player";
import InfrastructureCard from "../types/infrastructure_card";

abstract class CardPowerPlant extends InfrastructureCard {
    constructor(id: number) {
        super(
            id, 
            'Kraftwerk',
            0,
            {
                energy: 5,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: 0,
                handCardLimit: 0
            }
        )
        this.onlyAttachableToColony = true;
    }
    onUtilizaton(_: Player) {}
    onRetraction(_: Player) {}
}

abstract class NuclearReactorCard extends InfrastructureCard {
    constructor(id: number) {
        super(
            id, 
            'Atomreaktor',
            0,
            {
                energy: 2,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: -1,
                delta: 0,
                psi: 0,
                handCardLimit: 0
            }
        );
    }
    onUtilizaton(_: Player) {}
    onRetraction(_: Player) {}
}

abstract class SolarPanelCard extends InfrastructureCard {
    constructor(id: number) {
        super(
            id, 
            'Solarpanele',
            0,
            {
                energy: 1,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: 0,
                handCardLimit: 0
            }
        );
    }
    onUtilizaton(_: Player) {}
    onRetraction(_: Player) {}
}

export class Card105 extends InfrastructureCard {
    constructor() {
        super(
            105, 
            'Antimateriereaktor',
            5,
            {
                energy: 10,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: -3,
                delta: 0,
                psi: 0,
                handCardLimit: 0
            }
        );
    }
    onUtilizaton(_: Player) {}
    onRetraction(_: Player) {}
    onDestruction(player: Player) {
        const battle = player.match.battle;
        if (player.match.turnPhase == TurnPhase.Combat && battle.type != BattleType.None) {
            battle.ships.flat().forEach(cs => cs.damage++);
        }
    }
}

export class Card145 extends InfrastructureCard {
    constructor() {
        super(
            145, 
            'Fusionsreaktor',
            2,
            {
                energy: 4,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: -2,
                delta: 0,
                psi: 0,
                handCardLimit: 0
            }
        );
    }
    onUtilizaton(_: Player) {}
    onRetraction(_: Player) {}
}

export class Card185 extends CardPowerPlant {
    constructor() {
        super(185)
    }
}

export class Card187 extends NuclearReactorCard {
    constructor() {
        super(187);
    }
}

export class Card188 extends SolarPanelCard {
    constructor() {
        super(188);
    }
}

export class Card242 extends CardPowerPlant {
    constructor() {
        super(242)
    }
}

export class Card244 extends NuclearReactorCard {
    constructor() {
        super(244);
    }
}

export class Card245 extends SolarPanelCard {
    constructor() {
        super(245);
    }
}

export class Card350 extends CardPowerPlant {
    constructor() {
        super(350)
    }
}

export class Card352 extends NuclearReactorCard {
    constructor() {
        super(352);
    }
}

export class Card353 extends SolarPanelCard {
    constructor() {
        super(353);
    }
}

export class Card451 extends NuclearReactorCard {
    constructor() {
        super(451);
    }
}

export class Card452 extends SolarPanelCard {
    constructor() {
        super(452);
    }
}

export class Card453 extends CardPowerPlant {
    constructor() {
        super(453)
    }
}