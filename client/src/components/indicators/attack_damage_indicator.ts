import { ClientAttack } from "../../../../server/src/components/api/client_state";
import { animationConfig } from "../../config/animation";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";
import CardStack from "../card/card_stack";

export default class AttackDamageIndicator {
    private scene!: Game;
    private cardImage!: Phaser.GameObjects.Image;
    constructor(scene: Game, cardStack: CardStack, attack: ClientAttack) {
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
        const particleEmitters = [
            [ 'red', Math.round((attack.shield + attack.armour + attack.damage) / 2) ],
            [ 'blue', attack.shield * 2 ],
            [ 'white', attack.armour * 2 ],
            [ 'yellow', attack.damage * 2 ]
        ]
            .filter(([_, n]) => Number(n) > 0)
            .map(([color, n]) => {
                const emitter = this.createParticleEmitter(String(color));
                emitter.explode(Number(n));
                return emitter;
            });
        setTimeout(() => {
            particleEmitters.forEach(pe => pe.destroy());
        }, animationConfig.duration.attack);
    }
    private createParticleEmitter(color: string): Phaser.GameObjects.Particles.ParticleEmitter {
        return this.scene.add.particles(
            this.cardImage.x, 
            this.cardImage.y + animationConfig.attack.flare.yOffset,
            `flare_${color}`,
            {
                lifespan: animationConfig.attack.flare.lifetime,
                speed: { min: 150, max: 300 },
                scale: { start: 0.8, end: 0 },
                gravityY: 15,
                blendMode: 'ADD',
                emitting: false
            }
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
