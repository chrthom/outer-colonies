import { CardType } from "../../config/enums";
import Player from "../../game_state/player";
import ActionPool, { CardAction } from "../action_pool";
import InfrastructureCard from "../types/infrastructure_card";

function addToActionPool(player: Player, card: InfrastructureCard) {
    player.actionPool.push(...card.actionPool().getPool());
}

export class Card135 extends InfrastructureCard {
    constructor() {
        super(
            135, 
            'Schiffswerft',
            2,
            {
                energy: -2,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: -1,
                handCardLimit: 0
            }
        )
    }
    immediateEffect(player: Player) {
        addToActionPool(player, this);
    }
    actionPool(): ActionPool {
        return new ActionPool(new CardAction(CardType.Hull));
    }
}

export class Card154 extends InfrastructureCard {
    constructor() {
        super(
            154, 
            'Bergbauaußenposten',
            2,
            {
                energy: -1,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: -1,
                handCardLimit: 0
            }
        )
    }
    immediateEffect(player: Player) {
        addToActionPool(player, this);
    }
    actionPool(): ActionPool {
        return new ActionPool(new CardAction(CardType.Infrastructure));
    }
}

export class Card164 extends InfrastructureCard {
    constructor() {
        super(
            164,
            'Rüstungsschmiede',
            2,
            {
                energy: -2,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: -1,
                handCardLimit: 0
            }
        )
    }
    immediateEffect(player: Player) {
        addToActionPool(player, this);
    }
    actionPool(): ActionPool {
        return new ActionPool(new CardAction(CardType.Equipment));
    }
}

export class Card183 extends InfrastructureCard {
    constructor() {
        super(
            183, 
            'Industriekomplex',
            1,
            {
                energy: -5,
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
    immediateEffect(player: Player) {
        addToActionPool(player, this);
    }
    actionPool(): ActionPool {
        return new ActionPool(new CardAction(CardType.Equipment, CardType.Infrastructure, CardType.Hull));
    }
}
