import CardImage from "./card_image";
import Layout from "../../config/layout";
import Game from "../../scenes/game";
import { FrontendHandCard } from "../../../../backend/src/components/frontend_converters/frontend_state";
import { BattleType, TurnPhase } from "../../../../backend/src/components/config/enums";

const layout = new Layout();

export default class HandCard extends CardImage {
    uuid: string;
    data: FrontendHandCard;
    constructor(scene: Game, handCardsNum: number, handCardData: FrontendHandCard) {
        const invIndex = handCardsNum - handCardData.index - 1;
        const x = layout.player.hand.x + invIndex * layout.player.hand.xStep;
        const y = layout.player.hand.y + invIndex * layout.player.hand.yStep;
        const angle = layout.player.hand.startAngle + invIndex * layout.player.hand.angleStep;
        super(scene, x, y, handCardData.cardId);
        this.sprite.setAngle(angle);
        this.data = handCardData;
        this.uuid = handCardData.uuid;
        this.sprite.on('pointerdown', () => {
            this.onClickAction(scene);
        });
        this.enableMouseover(scene);
    }
    highlightPlayability() {
        if (this.data.playable) this.highlightReset();
        else this.highlightDisabled();
    }
    private onClickAction(scene: Game) {
        if (scene.state.playerPendingAction 
                && this.data.playable 
                && (scene.state.turnPhase != TurnPhase.Build || scene.plannedBattle.type == BattleType.None)) {
            const reset = scene.activeHandCard == this.uuid;
            scene.activeCardStack = null;
            scene.activeHandCard = null;
            if (!reset) {
                scene.activeHandCard = this.data.uuid;
            }
            scene.updateView();
        }
    }
}