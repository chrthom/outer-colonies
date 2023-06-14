import { EventType } from "../config/enums";
import Player from "../game_state/player";

export default class CardEvent {
    type!: EventType;
    player!: Player;
    oldUUID?: string;
    newUUID?: string;
    target?: string;
    constructor(type: EventType, player: Player) {
        this.type = type;
        this.player = player;
    }
}

export class DrawCardEvent extends CardEvent {
    constructor(player: Player, uuid: string) {
        super(EventType.Draw, player);
        this.newUUID = uuid;
    }
}