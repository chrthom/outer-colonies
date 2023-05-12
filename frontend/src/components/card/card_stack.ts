import CardImage from "./card_image";
import Layout from "../../config/layout";
import Game from "../../scenes/game";
import { BattleType, MsgTypeInbound, TurnPhase, Zone } from "../../../../backend/src/components/config/enums";
import { FrontendCardStack } from "../../../../backend/src/components/frontend_converters/frontend_state";
import { consts } from "../../../../backend/src/components/config/consts";

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
        const zoneLayout = data.ownedByPlayer ? layout.player[data.zone] : layout.opponent[data.zone];
        const x = zoneLayout.x + (data.zoneCardsNum == 1 ? zoneLayout.maxWidth / 2 : data.index * zoneLayout.maxWidth / (data.zoneCardsNum - 1));
        const yDistance = layout.stackYDistance * (data.ownedByPlayer ? 1 : -1);
        this.cards = data.cardIds.map((id, index) => new CardImage(scene, x, zoneLayout.y + index * yDistance, id, !data.ownedByPlayer));
        this.cards.forEach(c => {
            c.sprite.on('pointerdown', () => {
                this.onClickAction(scene);
            });
            if (data.uuid != consts.colonyPlayer && data.uuid != consts.colonyOpponent)
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
    private onClickAction(scene: Game) {
        const state = scene.state;
        if (state.playerPendingAction) {
            if (state.playerIsActive) {
                if (state.turnPhase == TurnPhase.Build) {
                    if (scene.activeCard) {
                        scene.socket.emit(MsgTypeInbound.Handcard, scene.activeCard, this.uuid);
                    } else if (this.uuid == consts.colonyOpponent) {
                        scene.resetPlannedBattle(scene.plannedBattle.type == BattleType.Raid ? BattleType.None : BattleType.Raid);
                    } else if (scene.plannedBattle.type != BattleType.None && this.data.missionReady) {
                        if (scene.plannedBattle.shipIds.includes(this.uuid)) {
                            scene.plannedBattle.shipIds = scene.plannedBattle.shipIds.filter(id => id != this.uuid);
                        } else {
                            scene.plannedBattle.shipIds.push(this.uuid);
                        }
                    }
                }
            } else {
                if (state.turnPhase == TurnPhase.Build) {
                    if (this.data.missionReady) {
                        if (scene.interveneShipIds.includes(this.uuid)) {
                            scene.interveneShipIds = scene.interveneShipIds.filter(id => id != this.uuid);
                        } else {
                            scene.interveneShipIds.push(this.uuid);
                        }
                    }
                }
            }
            scene.updateView();
        }
    }
}
