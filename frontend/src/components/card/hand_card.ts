import CardImage from "./card_image";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";
import { FrontendHandCard } from "../../../../backend/src/components/frontend_converters/frontend_state";
import { BattleType, MsgTypeInbound, TurnPhase } from "../../../../backend/src/components/config/enums";
import { animationConfig } from "../../config/animation";

export default class HandCard extends CardImage {
    uuid!: string;
    data!: FrontendHandCard;
    constructor(scene: Game, data: FrontendHandCard) {
        super(scene, layout.deck.x, layout.deck.y, data.cardId);
        this.uuid = data.uuid;
        this.update(data);
        this.image.on('pointerdown', () => this.onClickAction());
        this.enableMaximizeOnMouseover();
    }
    discard() {
        const discardPileIds = this.scene.state.discardPileIds.slice();
        this.tween({
            targets: undefined,
            duration: animationConfig.duration.draw,
            x: layout.discardPile.x,
            y: layout.discardPile.y,
            angle: 0,
            onComplete: () => {
                this.scene.obj.discardPile.update(discardPileIds);
                this.destroy();
            }
        });
    }
    update(data: FrontendHandCard) {
        this.data = data;
        this.tween({
            targets: undefined,
            duration: animationConfig.duration.draw,
            x: this.x(),
            y: this.y(),
            angle: this.angle()
        });
    }
    highlightPlayability() {
        this.highlightReset();
        if (this.data.playable) this.highlightSelectable();
    }
    private invIndex(data: FrontendHandCard) {
        return this.scene.state.hand.length - data.index - 1;
    }
    private x() {
        return layout.player.hand.x + this.invIndex(this.data) * layout.player.hand.xStep;
    }
    private y() {
        return layout.player.hand.y + this.invIndex(this.data) * layout.player.hand.yStep;
    }
    private angle() {
        return layout.player.hand.startAngle + this.invIndex(this.data) * layout.player.hand.angleStep;
    }
    private onClickAction() {
        if (this.scene.state.playerPendingAction) {
            if (this.data.playable
                    && (this.scene.state.turnPhase != TurnPhase.Build || this.scene.plannedBattle.type == BattleType.None)) {
                const reset = this.scene.activeHandCard == this.uuid;
                this.scene.activeCardStack = null;
                this.scene.activeHandCard = null;
                if (!reset) this.scene.activeHandCard = this.uuid;
                this.scene.updateView();
            } else if (this.scene.state.turnPhase == TurnPhase.End) {
                this.scene.socket.emit(MsgTypeInbound.Discard, this.uuid);
            }
        }
    }
}
