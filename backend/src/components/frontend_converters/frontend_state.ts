import Match from '../game_state/match'
import Card from '../cards/card';
import { CardType, TurnPhase } from '../config/oc_enums'

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
    index!: number;
    cardId!: number;
    playable!: boolean;
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
        hand: player.hand.map((c: Card, index: number) => {
            return {
                index: index,
                cardId: c.id,
                playable: match.checkCardIsPlayable(c, playerNo)
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
