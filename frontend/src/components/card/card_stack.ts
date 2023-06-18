import { layout } from "../../config/layout";
import Game from "../../scenes/game";
import { BattleType, MsgTypeInbound, TurnPhase } from "../../../../backend/src/components/config/enums";
import { FrontendAttack, FrontendCard, FrontendCardStack } from "../../../../backend/src/components/frontend_converters/frontend_state";
import ValueIndicator from "./indicators/value_indicator";
import DefenseIndicator from "./indicators/defense_indicator";
import Card from "./card";
import { animationConfig } from "../../config/animation";
import HandCard from "./hand_card";
import { arrayDiff } from "../../../../backend/src/components/utils/utils";
import AttackDamageIndicator from "./indicators/attack_damage_indicator";

export default class CardStack {
    cards!: Array<Card>;
    uuid!: string;
    data!: FrontendCardStack;
    damageIndicator?: ValueIndicator;
    defenseIndicator?: DefenseIndicator;
    private scene!: Game;
    constructor(scene: Game, data: FrontendCardStack, origin?: HandCard) {
        this.scene = scene;
        this.uuid = data.uuid;
        this.data = data;
        this.createCards(origin);
    }
    discard(toDeck?: boolean) {
        this.destroyIndicators();
        this.cards.forEach(c => c.discard(this.data.ownedByPlayer, toDeck));
    }
    update(data: FrontendCardStack) {
        this.destroyIndicators();
        const [removedCardIds, newCardIds] = arrayDiff(this.cards.map(c => c.cardId), data.cards.map(c => c.id));
        this.filterCardsByIdList(data.cards.map(c => c.id)).forEach(c => c.destroy());
        if (removedCardIds.length) this.scene.retractCardsExists = true;
        this.filterCardsByIdList(removedCardIds).forEach(c => c.discard(this.data.ownedByPlayer, true));
        this.data.cards = data.cards;
        this.data.damage = data.damage;
        this.data.defenseIcons = data.defenseIcons;
        this.createCards();
        this.data = data;
        this.filterCardsByIdList(newCardIds).forEach(c => {
            const handCard = this.scene.hand.find(h => h.cardId == c.cardId);
            const x = this.data.ownedByPlayer ? (handCard ? handCard.image.x : layout.deck.x) : layout.discardPile.x;
            const y = this.data.ownedByPlayer ? (handCard ? handCard.image.y : layout.deck.y) : layout.discardPile.yOpponent;
            const angle = this.data.ownedByPlayer ? (handCard ? handCard.image.angle : 0) : 180;
            c.setX(x).setY(y).setAngle(angle)
        });
        this.tween();
    }
    animateAttack() {
        this.highlightSelected();
        setTimeout(() => this.highlightReset(), animationConfig.duration.attack);
    }
    animateDamage(attack: FrontendAttack) {
        new AttackDamageIndicator(this.scene, this, attack);
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
    private filterCardsByIdList(list: number[]) {
        let l = list.slice();
        return this.cards.filter(c => {
            if (l.includes(c.cardId)) {
                l.splice(l.indexOf(c.cardId), 1);
                return true;
            } else {
                return false;
            }
        });
    }
    private tween() {
        this.cards.forEach((c, index) => {
            c.tween({
                targets: undefined,
                duration: animationConfig.duration.move,
                x: this.x(),
                y: this.y(index),
                angle: this.data.ownedByPlayer ? 0 : 180
            });
        });
        if (this.damageIndicator) this.damageIndicator.tween(this.x(), this.zoneLayout().y);
        if (this.defenseIndicator) this.defenseIndicator.tween(this.x(), this.zoneLayout().y);
    }
    private createCards(origin?: HandCard) {
        this.cards = this.data.cards.map(c => 
            new Card(this.scene, this.x(), this.y(c.index), !this.data.ownedByPlayer, this.uuid, c)
        );
        this.cards.forEach(c => {
            c.image.on('pointerdown', () => this.onClickAction(c.data));
            c.enableMaximizeOnMouseover();
        });
        if (this.data.damage > 0) {
            this.damageIndicator = new ValueIndicator(
                this.scene, 
                String(this.data.damage), 
                this.data.criticalDamage, 
                this.x(),
                this.zoneLayout().y,
                this.data.ownedByPlayer,
                false
            );
        }
        if (this.scene.state.turnPhase == TurnPhase.Combat 
            && this.scene.state.battle.playerShipIds.concat(this.scene.state.battle.opponentShipIds).includes(this.uuid)
        ) {
            this.defenseIndicator = new DefenseIndicator(
                this.scene,
                this.data.defenseIcons,
                this.x(),
                this.zoneLayout().y,
                this.data.ownedByPlayer
            );
        }
        if (origin) {
            this.cards[0]
                .setX(origin.image.x)
                .setY(origin.image.y)
                .setAngle(origin.image.angle);
            this.tween();
        }
    }
    private x() {
        return this.zoneLayout().x + (this.data.zoneCardsNum == 1 
            ? this.zoneLayout().maxWidth / 2 
            : this.data.index * this.zoneLayout().maxWidth / (this.data.zoneCardsNum - 1));
    }
    private y(index: number) {
        const yDistance = layout.stackYDistance * (this. data.ownedByPlayer ? 1 : -1);
        return this.zoneLayout().y + index * yDistance;
    }
    private zoneLayout() {
        return this.data.ownedByPlayer ? layout.player[this.data.zone] : layout.opponent[this.data.zone];
    }
    private destroyIndicators() {
        if (this.damageIndicator) this.damageIndicator.destroy();
        if (this.defenseIndicator) this.defenseIndicator.destroy();
        this.cards.forEach(c => c.destroyButton());
    }
    private onClickAction(cardData: FrontendCard) {
        const state = this.scene.state;
        if (state.playerPendingAction) {
            switch (state.turnPhase) {
                case TurnPhase.Build:
                    if (state.playerIsActive) {
                        if (this.scene.activeHandCard) {
                            this.scene.socket.emit(MsgTypeInbound.Handcard, this.scene.activeHandCard, this.uuid);
                        } else if (this.isOpponentColony()) {
                            this.scene.resetView(this.scene.plannedBattle.type == BattleType.Raid ? BattleType.None : BattleType.Raid);
                        } else if (this.scene.plannedBattle.type != BattleType.None && this.data.missionReady) {
                            if (this.scene.plannedBattle.shipIds.includes(this.uuid)) {
                                this.scene.plannedBattle.shipIds = this.scene.plannedBattle.shipIds.filter(id => id != this.uuid);
                            } else {
                                this.scene.plannedBattle.shipIds.push(this.uuid);
                            }
                        }
                    } else {
                        if (this.data.missionReady) {
                            if (this.scene.interveneShipIds.includes(this.uuid)) {
                                this.scene.interveneShipIds = this.scene.interveneShipIds.filter(id => id != this.uuid);
                            } else if (this.data.interventionReady) {
                                this.scene.interveneShipIds.push(this.uuid);
                            }
                        }
                    }
                    break;
                case TurnPhase.Combat:
                    if (this.scene.activeCardStack == this.uuid && this.scene.activeCardStackIndex == cardData.index) {
                        this.scene.activeCardStack = null;
                        this.scene.activeCardStackIndex = null;
                        this.scene.activeHandCard = null;
                    } else if (cardData.battleReady) {
                        this.scene.activeCardStack = this.uuid;
                        this.scene.activeCardStackIndex = cardData.index;
                        this.scene.activeHandCard = null;
                    } else if (this.scene.activeCardStack && this.scene.state.battle.opponentShipIds.includes(this.uuid)) {
                        this.scene.socket.emit(MsgTypeInbound.Attack, this.scene.activeCardStack, this.scene.activeCardStackIndex, this.uuid);
                    }
                    break;
            }
            this.scene.updateView();
        }
    }
}
