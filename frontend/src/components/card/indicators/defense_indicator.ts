import { FrontendDefenseIcon } from "../../../../../backend/src/components/frontend_converters/frontend_state";
import Layout from "../../../config/layout";
import Game from "../../../scenes/game";

const layout = new Layout();

export default class DefenseIndicator {
    sprites: Phaser.GameObjects.Image[];
    constructor(scene: Game, defenseIcons: FrontendDefenseIcon[], cardX: number, cardY: number, ownedByPlayer: boolean) {
        this.sprites = defenseIcons.map((icon, index) => scene.add
            .image(
                cardX + layout.cards.defenseIndicator.xOffset,
                cardY + (ownedByPlayer ? layout.cards.defenseIndicator.yOffsetPlayer : layout.cards.defenseIndicator.yOffsetOpponent) 
                    + index * layout.cards.defenseIndicator.yDistance,
                `icon_${icon.icon}`
            ).setOrigin(0.5, 0.5)
            .setTint(icon.depleted ? layout.colors.secondary : layout.colors.primary)
            .setAlpha(layout.colors.alpha)
        );
    }
    destroy() {
        this.sprites.forEach(i => i.destroy());
    }

}