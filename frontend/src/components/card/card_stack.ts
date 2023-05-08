import CardImage from "./card_image";
import Layout from "../../config/layout";
import Game from "../../scenes/game";
import { MsgTypeInbound, TurnPhase, Zone } from "../../../../backend/src/components/config/enums";
import { FrontendCardStack } from "../../../../backend/src/components/frontend_converters/frontend_state";

const layout = new Layout();

export default class CardStack {
    cards: Array<CardImage>;
    uuid: string;
    zone: Zone;
    ownedByPlayer: boolean;
    damage: number;
    data: FrontendCardStack;
    constructor(scene: Game, data: FrontendCardStack) {
        const self = this;
        const zoneLayout = layout[data.ownedByPlayer ? 'player' : 'opponent'][data.zone];
        const x = zoneLayout.x + (data.zoneCardsNum == 1 ? zoneLayout.maxWidth / 2 : data.index * zoneLayout.maxWidth / (data.zoneCardsNum - 1));
        const yDistance = layout.stackYDistance * (data.ownedByPlayer ? 1 : -1);
        this.cards = data.cardIds.map((id, index) => new CardImage(scene, x, zoneLayout.y + index * yDistance, id, !data.ownedByPlayer));
        this.cards.forEach(c => {
            c.sprite.on('pointerdown', () => {
                this.onClickAction(scene);
            });
            c.enableMouseover(scene);
        });
        this.uuid = data.uuid; // TODO: Remove, is in this.data
        this.zone = data.zone; // TODO: Remove, is in this.data
        this.ownedByPlayer = data.ownedByPlayer; // TODO: Remove, is in this.data
        this.damage = data.damage; // TODO: Remove, is in this.data
        this.data = data;
    }
    destroy() {
        this.cards.forEach(c => c.destroy());
    }
    highlightDisabled() {
        this.cards.forEach(c => {
            c.highlightDisabled();
        });
    }
    highlightSelected() {
        this.cards.forEach(c => c.highlightSelected());
    }
    highlightReset() {
        this.cards.forEach(c => {
            c.highlightReset();
        });
    }
    highlightMissionReady() {
        if (this.data.missionReady && this.data.ownedByPlayer) this.highlightReset();
        else this.highlightDisabled();
    }
    private onClickAction(scene: Game) {
        if (scene.state.turnPhase == TurnPhase.Build && scene.activeCard)
            scene.socket.emit(MsgTypeInbound.Handcard, scene.activeCard, this.uuid);
    }
}
