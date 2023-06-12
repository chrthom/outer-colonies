import CardImage from "./card_image";
import Layout from "../../config/layout";
import Game from "../../scenes/game";

const layout = new Layout();

export default class MissionCards {
    minCards: CardImage[] = [];
    update(scene: Game) {
        if (scene.state && scene.state.battle) {
            const battle = scene.state.battle;
            this.minCards = battle.priceCardIds.map((id, index) => {
                return new CardImage(
                    scene,
                    layout.missionCards.x + index * layout.missionCards.xDistance,
                    layout.missionCards.y + index * layout.missionCards.yDistance,
                    id,
                    false,
                    layout.cards.scale.min
                )
            });
            this.minCards.filter(c => c.cardId != 1).forEach(c => c.enableMouseover(scene));
        }
    }
}