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
        this.data = data;
        this.uuid = data.uuid;
        this.update(scene, data);
        this.image.on('pointerdown', () => {
            this.onClickAction(scene);
        });
        this.enableMouseover(scene);
    }
    update(scene: Game, data: FrontendHandCard) {
        this.tween(scene, this.x(scene, data), this.y(scene, data), this.angle(scene, data));
        /*
        this.sprite
            .setX(this.x(scene, data))
            .setY(this.y(scene, data))
            .setAngle(this.angle(scene, data));
        */
    }
    highlightPlayability() {
        this.highlightReset();
        if (this.data.playable) this.highlightSelectable();
    }
    private invIndex(scene: Game, data: FrontendHandCard) {
        return scene.state.hand.length - data.index - 1;
    }
    private x(scene: Game, data: FrontendHandCard) {
        return layout.player.hand.x + this.invIndex(scene, data) * layout.player.hand.xStep;
    }
    private y(scene: Game, data: FrontendHandCard) {
        return layout.player.hand.y + this.invIndex(scene, data) * layout.player.hand.yStep;
    }
    private angle(scene: Game, data: FrontendHandCard) {
        return layout.player.hand.startAngle + this.invIndex(scene, data) * layout.player.hand.angleStep;
    }
    private onClickAction(scene: Game) {
        if (scene.state.playerPendingAction) {
            if (this.data.playable
                    && (scene.state.turnPhase != TurnPhase.Build || scene.plannedBattle.type == BattleType.None)) {
                const reset = scene.activeHandCard == this.uuid;
                scene.activeCardStack = null;
                scene.activeHandCard = null;
                if (!reset) {
                    scene.activeHandCard = this.uuid;
                }
                scene.updateView();
            } else if (scene.state.turnPhase == TurnPhase.End) {
                scene.socket.emit(MsgTypeInbound.Discard, this.uuid);
            }
        }
    }
}
