import CardImage from "./card_image";
import Layout from "../../config/layout";
import Game from "../../scenes/game";
import { BattleType, MsgTypeInbound, TurnPhase } from "../../../../backend/src/components/config/enums";
import { FrontendCardStack } from "../../../../backend/src/components/frontend_converters/frontend_state";
import DamageIndicator from "./indicators/damage_indicator";

const layout = new Layout();

export default class CardStack {
    cards!: Array<CardImage>;
    uuid!: string;
    data!: FrontendCardStack;
    damageIndicator?: DamageIndicator;
    constructor(scene: Game, data: FrontendCardStack) {
        this.uuid = data.uuid;
        this.data = data;
        const zoneLayout = data.ownedByPlayer ? layout.player[data.zone] : layout.opponent[data.zone];
        const x = zoneLayout.x + (data.zoneCardsNum == 1 ? zoneLayout.maxWidth / 2 : data.index * zoneLayout.maxWidth / (data.zoneCardsNum - 1));
        const yDistance = layout.stackYDistance * (data.ownedByPlayer ? 1 : -1);
        this.cards = data.cardIds.map((id, index) => new CardImage(scene, x, zoneLayout.y + index * yDistance, id, !data.ownedByPlayer));
        this.cards.forEach((c, index) => {
            c.sprite.on('pointerdown', () => {
                this.onClickAction(scene, index);
            });
            if (!this.isPlayerColony() && !this.isOpponentColony())
                c.enableMouseover(scene);
        });
        if (data.damage > 0) {
            this.damageIndicator = new DamageIndicator(
                scene, 
                this.data.damage, 
                this.data.criticalDamage, 
                x + layout.cards.damageIndicator.xOffset, 
                zoneLayout.y + (data.ownedByPlayer ? layout.cards.damageIndicator.yOffsetPlayer : layout.cards.damageIndicator.yOffsetOpponent)
            );
        }
    }
    destroy() {
        this.cards.forEach(c => c.destroy());
        if (this.damageIndicator) this.damageIndicator.destroy();
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
    isPlayerColony() {
        return this.data.ownedByPlayer && this.data.cardIds[0] == 0;
    }
    isOpponentColony() {
        return !this.data.ownedByPlayer && this.data.cardIds[0] == 0;
    }
    private onClickAction(scene: Game, index: number) {
        const state = scene.state;
        if (state.playerPendingAction) {
            switch (state.turnPhase) {
                case TurnPhase.Build:
                    if (state.playerIsActive) {
                        if (scene.activeHandCard) {
                            scene.socket.emit(MsgTypeInbound.Handcard, scene.activeHandCard, this.uuid);
                        } else if (this.isOpponentColony()) {
                            scene.resetWithBattleType(scene.plannedBattle.type == BattleType.Raid ? BattleType.None : BattleType.Raid);
                        } else if (scene.plannedBattle.type != BattleType.None && this.data.missionReady) {
                            if (scene.plannedBattle.shipIds.includes(this.uuid)) {
                                scene.plannedBattle.shipIds = scene.plannedBattle.shipIds.filter(id => id != this.uuid);
                            } else {
                                scene.plannedBattle.shipIds.push(this.uuid);
                            }
                        }
                    } else {
                        if (this.data.missionReady) {
                            if (scene.interveneShipIds.includes(this.uuid)) {
                                scene.interveneShipIds = scene.interveneShipIds.filter(id => id != this.uuid);
                            } else if (this.data.interventionReady) {
                                scene.interveneShipIds.push(this.uuid);
                            }
                        }
                    }
                    break;
                case TurnPhase.Combat:
                    if (scene.activeCardStack == this.uuid && scene.activeCardStackIndex == index) {
                        scene.activeCardStack = null;
                        scene.activeCardStackIndex = null;
                        scene.activeHandCard = null;
                    } else if (this.data.battleReadyCardIndexes.includes(index)) {
                        scene.activeCardStack = this.uuid;
                        scene.activeCardStackIndex = index;
                        scene.activeHandCard = null;
                    } else if (scene.activeCardStack && scene.state.battle.opponentShipIds.includes(this.uuid)) {
                        // TODO: Add fire on colony and cards in colony zone
                        scene.socket.emit(MsgTypeInbound.Attack, scene.activeCardStack, scene.activeCardStackIndex, this.uuid);
                    }
                    break;
            }
            scene.updateView();
        }
    }
}
