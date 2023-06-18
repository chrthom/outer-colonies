import { FrontendAttack } from "../../../../../backend/src/components/frontend_converters/frontend_state";
import { animationConfig } from "../../../config/animation";
import { layout } from "../../../config/layout";
import Game from "../../../scenes/game";
import CardStack from "../card_stack";

export default class AttackDamageIndicator {
    private scene!: Game;
    private cardImage!: Phaser.GameObjects.Image;
    constructor(scene: Game, cardStack: CardStack, attack: FrontendAttack) {
        this.scene = scene;
        this.cardImage = cardStack.cards[0].image;
        const self = this;
        [ 'pointDefense', 'shield', 'armour', 'damage' ]
            .map(key => [ attack[key], layout.attack.color[key] ])
            .filter(([value, _]) => value > 0)
            .forEach(([value, color], index) =>
                setTimeout(() => 
                    self.tween(this.createIndicator(value, color)), animationConfig.attack.indicator.spawnInterval * index
                )
            );
    }
    private createIndicator(value: number, color: string) {
        return this.scene.add.text(this.cardImage.x, this.cardImage.y, String(value))
            .setFontSize(layout.attack.fontSize)
            .setFontFamily(layout.font.family)
            .setColor(color)
            .setAlign('center')
            .setOrigin(0.5, 1);
    }
    private tween(target: Phaser.GameObjects.Text) {
        this.scene.tweens.add({
            targets: target,
            duration: animationConfig.duration.attack,
            y: target.y - animationConfig.attack.indicator.yTween,
            alpha: 0,
            onComplete: () => target.destroy()
        });
    }
}