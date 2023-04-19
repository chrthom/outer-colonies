import Match from '../game_state/match'
import Card from '../cards/card';
import CardStack from '../cards/card_stack';
import { CardType, TurnPhase, Zone } from '../config/enums'

class FrontendOpponent {
    name!: string;
    handCardNo!: number;
}
class FrontendActions {
    hull!: number;
    equipment!: number;
    colony!: number;
    tactic!: number;
    orb!: number;
}

class FrontendHandCard {
    uuid!: string;
    cardId!: string;
    index!: number;
    playable!: boolean;
    validTargets!: FrontendHandCardTargets;
}

class FrontendHandCardTargets {
    cardUUIDs!: Array<string>;
    ownColony!: boolean;
    opponentColony!: boolean;
}

class FrontendCardStack {
    uuid!: string;
    cardIds!: Array<string>;
    zone!: Zone;
    index!: number;
    zoneCardsNum!: number;
    ownedByPlayer!: boolean;
    damage!: number;
}

class FrontendState {
    playerIsActive!: boolean;
    turnPhase!: TurnPhase;
    opponent!: FrontendOpponent;
    hand!: Array<FrontendHandCard>;
    cardStacks!: Array<FrontendCardStack>;
    remainingActions: FrontendActions;
}

export default function toFrontendState(match: Match, playerNo: number): FrontendState {
    const player = match.players[playerNo];
    const opponent = match.players[match.opponentPlayerNo(playerNo)];
    let cardStacks = [true, false].flatMap((ownedByPlayer: boolean) => {
        const playerCardStacks = ownedByPlayer ? player.cardStacks : opponent.cardStacks;
        return [Zone.Colony, Zone.Oribital, Zone.Neutral].flatMap((zone: Zone) => {
            const zoneCardStacks = playerCardStacks.filter((cs: CardStack) => cs.zone == zone);
            const colonyPlaceholder = (zone == Zone.Colony ? 1 : 0);
            return zoneCardStacks.map((cs: CardStack, index: number) => {
                return {
                    uuid: cs.uuid,
                    cardIds: cs.getCards().map((c: Card) => String(c.id)),
                    zone: zone,
                    index: index + colonyPlaceholder,
                    zoneCardsNum: zoneCardStacks.length + colonyPlaceholder,
                    ownedByPlayer: ownedByPlayer,
                    damage: 0 // TODO: Implement once needed
                };
            });
        });
    });
    return {
        playerIsActive: match.activePlayerNo == playerNo,
        turnPhase: match.turnPhase,
        opponent: {
            name: opponent.name,
            handCardNo: opponent.hand.length
        },
        hand: player.hand.map((c: CardStack, index: number) => {
            return {
                uuid: c.uuid,
                cardId: String(c.card.id),
                index: index,
                playable: c.card.isPlayable(match, playerNo),
                validTargets: {
                    cardUUIDs: c.card.canBeAttachedTo(player.cardStacks).map((cs: CardStack) => cs.uuid),
                    ownColony: c.card.canBeAttachedToColony(player.cardStacks),
                    opponentColony: false // TODO: Implement this when needed for tactic cards
                }
            };
        }),
        cardStacks: cardStacks,
        remainingActions: {
            hull: player.remainingActions[CardType.Hull],
            equipment: player.remainingActions[CardType.Equipment],
            colony: player.remainingActions[CardType.Colony],
            tactic: player.remainingActions[CardType.Tactic],
            orb: player.remainingActions[CardType.Orb]
        }
    };
}
