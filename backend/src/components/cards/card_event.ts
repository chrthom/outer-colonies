import { AnimatedEvent } from "../config/enums";

export default class CardEvent {
    type!: AnimatedEvent;
    oldUUID?: string;
    newUUID?: string;
    target?: string;
    constructor(type: AnimatedEvent) {
        this.type = type;
    }
}

export class DrawCardEvent extends CardEvent {
    constructor(uuid: string) {
        super(AnimatedEvent.Draw);
        this.newUUID = uuid;
    }
}