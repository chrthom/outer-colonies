import { layout } from "../../config/layout";
import Game from "../../scenes/game";
import { BattleType, MsgTypeInbound, TurnPhase } from "../../../../backend/src/components/config/enums";
import { FrontendCard, FrontendCardStack } from "../../../../backend/src/components/frontend_converters/frontend_state";
import ValueIndicator from "./indicators/value_indicator";
import DefenseIndicator from "./indicators/defense_indicator";
import Card from "./card";

export default class CardStack {
    cards!: Array<Card>;
    uuid!: string;
    data!: FrontendCardStack;
    damageIndicator?: ValueIndicator;
    defenseIndicator?: DefenseIndicator;
    constructor(scene: Game, data: FrontendCardStack) {
        this.uuid = data.uuid;
        this.data = data;
        const zoneLayout = data.ownedByPlayer ? layout.player[data.zone] : layout.opponent[data.zone];
        const x = zoneLayout.x + (data.zoneCardsNum == 1 ? zoneLayout.maxWidth / 2 : data.index * zoneLayout.maxWidth / (data.zoneCardsNum - 1));
        const yDistance = layout.stackYDistance * (data.ownedByPlayer ? 1 : -1);
        this.cards = data.cards.map(c => new Card(scene, x, zoneLayout.y + c.index * yDistance, !data.ownedByPlayer, this.uuid, c));
        this.cards.forEach(c => {
            c.sprite.on('pointerdown', () => this.onClickAction(scene, c.data));
            c.enableMouseover(scene);
        });
        if (data.damage > 0) {
            this.damageIndicator = new ValueIndicator(
                scene, 
                String(this.data.damage), 
                this.data.criticalDamage, 
                x,
                zoneLayout.y,
                data.ownedByPlayer,
                false
            );
        }
        if (scene.state.turnPhase == TurnPhase.Combat 
            && scene.state.battle.playerShipIds.concat(scene.state.battle.opponentShipIds).includes(this.uuid)
        ) {
            this.defenseIndicator = new DefenseIndicator(
                scene,
                data.defenseIcons,
                x,
                zoneLayout.y,
                data.ownedByPlayer
            );
        }
    }
    destroy() {
        this.cards.forEach(c => c.destroy());
        if (this.damageIndicator) this.damageIndicator.destroy();
        if (this.defenseIndicator) this.defenseIndicator.destroy();
    }
    highlightDisabled() {
        this.cards.forEach(c => {
            c.highlightDisabled();
        });
    }
    highlightSelectable() {
        this.cards.forEach(c => c.highlightSelectable());
    }
    highlightSelected() {
        this.cards.forEach(c => c.highlightSelected());
    }
    highlightReset() {
        this.cards.forEach(c => {
            c.highlightReset();
        });
    }
    isOpponentColony() {
        return !this.data.ownedByPlayer && this.data.cards[0].id == 0;
    }
    private onClickAction(scene: Game, cardData: FrontendCard) {
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
                    if (scene.activeCardStack == this.uuid && scene.activeCardStackIndex == cardData.index) {
                        scene.activeCardStack = null;
                        scene.activeCardStackIndex = null;
                        scene.activeHandCard = null;
                    } else if (cardData.battleReady) {
                        scene.activeCardStack = this.uuid;
                        scene.activeCardStackIndex = cardData.index;
                        scene.activeHandCard = null;
                    } else if (scene.activeCardStack && scene.state.battle.opponentShipIds.includes(this.uuid)) {
                        scene.socket.emit(MsgTypeInbound.Attack, scene.activeCardStack, scene.activeCardStackIndex, this.uuid);
                    }
                    break;
            }
            scene.updateView();
        }
    }
}
