import { CardType } from "../../config/enums";
import Player from "../../game_state/player";
import ActionPool, { CardAction } from "../action_pool";
import InfrastructureCard from "../types/infrastructure_card";

export class Card135 extends InfrastructureCard {
    constructor() {
        super(
            135, 
            'Schiffswerft',
            {
                energy: -2,
                hp: 0,
                speed: 0,
                theta: 0,
                xi: 0,
                phi: 0,
                omega: 0,
                delta: 0,
                psi: -1
            }
        )
    }
    immediateEffect(player: Player) {
        player.actionPool.push(...this.actionPool().getPool());
    }
    actionPool(): ActionPool {
        return new ActionPool(new CardAction(CardType.Hull));
    }
}