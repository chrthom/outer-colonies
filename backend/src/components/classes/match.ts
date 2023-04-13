import Player from './player';
import { rules } from '../rules';
import { Card, CardType } from './cards/card';

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

export enum TurnPhase {
    Start = 'start',
    Build = 'build',
    Plan = 'plan',
    Fight = 'fight',
    End = 'end'
}

export default class Match {
    readonly room!: string;
    players: Array<Player> = [];
    activePlayerNo = 0;
    turnPhase = TurnPhase.Start;
    constructor(room: string) {
        this.room = room;
    }
    matchName(): string {
        return this.players[0].name + ' vs. ' + this.players[1].name;
    }
    opponentPlayerNo(playerNo: number): number {
        return playerNo == 0 ? 1 : 0;
    }
    getActivePlayer(): Player {
        return this.players[this.activePlayerNo];
    }
    setStartPlayer(): void {
        if (this.players[0].deck.length > this.players[1].deck.length) this.activePlayerNo = 0;
        else if (this.players[0].deck.length < this.players[1].deck.length) this.activePlayerNo = 1;
        else this.activePlayerNo = Math.round(Math.random());
    }
    execStartPhase(): void { // TODO: Return Event to send to player
        this.activePlayerNo = this.activePlayerNo == 0 ? 1 : 0;
        this.turnPhase = TurnPhase.Start;
        this.getActivePlayer().resetRemainingActions();
        // TODO: Move ships from neutral zone to orbital zone
        this.getActivePlayer().drawCards(rules.cardsToDrawPerTurn);
        // TODO: Check if no cards are left in deck
        // TODO: Check for effects on drawing a cards (like drawing an extra card)
        // TODO: Execute start of turn effects of cards
    }
    execBuildPhase(): void {
        this.turnPhase = TurnPhase.Build;
        // TODO
    }
    getFrontendState(playerNo: number): FrontendState {
        const player = this.players[playerNo];
        const opponent = this.players[this.opponentPlayerNo(playerNo)];
        return {
            playerIsActive: this.activePlayerNo == playerNo,
            turnPhase: this.turnPhase,
            opponent: {
                name: opponent.name,
                handCardNo: opponent.hand.length
            },
            hand: player.hand.map((c: Card, index: number) => {
                return {
                    index: index,
                    cardId: c.id,
                    playable: this.checkCardIsPlayable(c, player, this.activePlayerNo == playerNo)
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
    private checkCardIsPlayable(card: Card, player: Player, isActive: boolean): boolean {
        if (isActive) {
            if (player.remainingActions[card.type] == 0) return false;
            if (this.turnPhase == TurnPhase.Build) 
                switch (card.type) {
                    case CardType.Colony: 
                        return false;
                    case CardType.Equipment:
                        return false;
                    case CardType.Hull:
                        return true;
                    case CardType.Orb:
                        return false;
                    case CardType.Tactic:
                        return false;
                }
            return false; // TODO: Change for tactic cardsthat are always playable
        } else {
            return false; // TODO: Change for tactic cards that are always playable
        }
    }
}