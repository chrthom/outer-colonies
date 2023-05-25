import { CardType } from "../../config/enums";
import Player from "../../game_state/player";
import ActionPool, { CardAction } from "../action_pool";
import CardStack from "../card_stack";
import TacticCard from "../types/tactic_card";

export class Card141 extends TacticCard {
    private oneTimeActionPool = new ActionPool(
        new CardAction(CardType.Equipment),
        new CardAction(CardType.Hull),
        new CardAction(CardType.Infrastructure)
    );
    constructor() {
        super(
            141, 
            'Externe Arbeitskräfte',
            2,
            false,
            false
        )
    }
    immediateEffect(player: Player) {
        player.actionPool.push(...this.oneTimeActionPool.getPool().slice());
    }
    getValidTargets(player: Player): CardStack[] {
        return this.onlyColonyTarget(player.cardStacks);
    }
}

export class Card165 extends TacticCard {
    private readonly cardsToDrawPerPsiSocket = 2;
    constructor() {
        super(
            165, 
            'Konvoi',
            1,
            false,
            false
        )
    }
    immediateEffect(player: Player) {
        const freePsiSockets = this.calcFreePsiSockets(player);
        if (freePsiSockets) {
            player.drawCards(freePsiSockets * this.cardsToDrawPerPsiSocket);
        }
    }
    getValidTargets(player: Player): CardStack[] {
        return this.calcFreePsiSockets(player) > 0 ? this.onlyColonyTarget(player.cardStacks) : [];
    }
    private calcFreePsiSockets(player: Player): number {
        return player.cardStacks
            .map(cs => cs.profile())
            .filter(p => p.speed >= 2 && p.psi > 0)
            .map(p => p.psi)
            .reduce(psi => psi + psi, 0);
    }
}

export class Card232 extends TacticCard {
    private readonly cardsToDraw = 2;
    constructor() {
        super(
            232, 
            'Warenlieferung',
            1,
            false,
            false
        )
    }
    immediateEffect(player: Player) {
        player.drawCards(this.cardsToDraw);
    }
    getValidTargets(player: Player): CardStack[] {
        return this.onlyColonyTarget(player.cardStacks);
    }
}

export class Card321 extends TacticCard {
    private readonly cardsToRestore = 6;
    constructor() {
        super(
            321,
            'Recycling',
            2,
            false,
            false
        )
    }
    immediateEffect(player: Player) {
        for (let i = 0; i < this.cardsToRestore; i++) {
            player.deck.push(player.discardPile.pop());
        }
    }
    getValidTargets(player: Player): CardStack[] {
        return this.onlyColonyTarget(player.cardStacks);
    }
}

export class Card427 extends TacticCard {
    private readonly cardsToDraw = 2;
    constructor() {
        super(
            427,
            'Immigranten von der Erde',
            2,
            false,
            false
        )
    }
    immediateEffect(player: Player) {
        let foundCards = 0;
        for (let i = 0; i < player.deck.length; i++) {
            if (player.deck[i].type == CardType.Infrastructure) {
                player.takeCards(player.deck.splice(i, 1));
                if (++foundCards == this.cardsToDraw) break;
            }
        }
        player.shuffleDeck();
    }
    getValidTargets(player: Player): CardStack[] {
        return this.onlyColonyTarget(player.cardStacks);
    }
}
