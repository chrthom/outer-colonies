import CardImage from "./card_image";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";

export default class MissionCards {
    minCards: CardImage[] = [];
    private scene!: Game;
    constructor(scene: Game) {
        this.scene = scene;
    }
    update() {
        if (this.scene.state && this.scene.state.battle) {
            const battle = this.scene.state.battle;
            if (this.minCards) this.minCards.forEach(c => c.destroy());
            this.minCards = battle.priceCardIds.map((id, index) => {
                return new CardImage(
                    this.scene,
                    layout.missionCards.x + index * layout.missionCards.xDistance,
                    layout.missionCards.y + index * layout.missionCards.yDistance,
                    id,
                    false,
                    layout.cards.scale.min
                )
            });
            this.minCards.filter(c => c.cardId != 1).forEach(c => c.enableMaximizeOnMouseover());
        }
    }
}