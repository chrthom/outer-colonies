import Player from './player';
import { Card } from './cards/card';

class FrontendOpponent {
    name!: string;
    handCardNo!: number;
}

class FrontendState {
    opponent!: FrontendOpponent;
    hand!: Array<Card>;
}

export default class Match {
    readonly room!: string;
    players: Array<Player> = [];
    constructor(room: string) {
        this.room = room;
    }
    matchName(): string {
        return this.players[0].name + ' vs. ' + this.players[1].name;
    }
    opponentPlayerNo(playerNo): number {
        return playerNo == 0 ? 1 : 0;
    }
    getFrontendState(playerNo: number): FrontendState {
        const player = this.players[playerNo];
        const opponent = this.players[this.opponentPlayerNo(playerNo)];
        return {
            opponent: {
                name: opponent.name,
                handCardNo: opponent.hand.length
            },
            hand: player.hand
        };
    }
}