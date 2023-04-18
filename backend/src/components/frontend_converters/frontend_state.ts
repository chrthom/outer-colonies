import Match from '../game_state/match'
import CardStack from '../cards/card_stack';
import { CardType, TurnPhase } from '../config/enums'

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
    cardId!: number;
    index!: number;
    playable!: boolean;
    validTargets!: FrontendHandCardTargets;
}

class FrontendHandCardTargets {
    cardUUIDs: Array<string>;
    ownColony: boolean;
    opponentColony: boolean;
}

class FrontendState {
    playerIsActive: boolean;
    turnPhase: TurnPhase;
    opponent!: FrontendOpponent;
    hand!: Array<FrontendHandCard>;
    remainingActions: FrontendActions;
}

export default function toFrontendState(match: Match, playerNo: number): FrontendState {
    const player = match.players[playerNo];
    const opponent = match.players[match.opponentPlayerNo(playerNo)];
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
                cardId: c.card.id,
                index: index,
                playable: c.card.isPlayable(match, playerNo),
                validTargets: {
                    cardUUIDs: c.card.canBeAttachedTo(player.cardStacks).map((cs: CardStack) => cs.uuid),
                    ownColony: c.card.canBeAttachedToColony(player.cardStacks),
                    opponentColony: false // TODO: Implement this when needed for tactic cards
                }
            };
        }),
        remainingActions: {
            hull: player.remainingActions[CardType.Hull],
            equipment: player.remainingActions[CardType.Equipment],
            colony: player.remainingActions[CardType.Colony],
            tactic: player.remainingActions[CardType.Tactic],
            orb: player.remainingActions[CardType.Orb]
        }
    };
}
