import { CardType } from "../../config/enums";
import Match from "../../game_state/match";
import ActionPool, { CardAction } from "../action_pool";
import InfrastructureCard from "../types/infrastructureCard";

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
    immediateEffect(match: Match) {
        match.players[match.actionPendingByPlayerNo].actionPool.pool.push(...this.actionPool().pool);
    }
    actionPool(): ActionPool {
        return new ActionPool(new CardAction(CardType.Hull));
    }
}