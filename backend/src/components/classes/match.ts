import Player from './player';

export default class Match {
    readonly room!: string;
    players: Array<Player> = [];
    constructor(room: string) {
        this.room = room;
    }
    matchName(): string {
        return this.players[0].name + ' vs. ' + this.players[1].name;
    }
}