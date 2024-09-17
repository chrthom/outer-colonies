import { designConfig } from 'src/app/config/design';
import { ClientAttack } from '../../../../../server/src/shared/interfaces/client_state';
import { animationConfig } from '../../config/animation';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import CardStack from '../card/card_stack';
import CardImage from '../card/card_image';

export default class AttackDamageIndicator {
  private scene: Game;
  private targetCard: CardImage;
  constructor(scene: Game, cardStack: CardStack, attack: ClientAttack) {
    this.scene = scene;
    this.targetCard = cardStack.cards[0];
    ['pointDefense', 'shield', 'armour', 'damage']
      .map(key => [key, attack[key as keyof ClientAttack]])
      .filter(([key, value]) => <string>key == 'damage' || <number>value > 0)
      .map(([key, value]) => [value, designConfig.color[key as keyof typeof designConfig.color]])
      .forEach(
        ([value, color], index) =>
          this.scene.time.delayedCall(animationConfig.attack.indicator.spawnInterval * index, () =>
            this.tween(this.createIndicator(<number>value, <string>color))
          ),
        this
      );
    const particleEmitters = [
      ['yellow', Math.round((attack.shield + attack.armour + attack.damage) / 3)],
      ['blue', attack.shield * 2],
      ['white', attack.armour * 2],
      ['red', attack.damage * 2]
    ]
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, n]) => Number(n) > 0)
      .map(([color, n]) => {
        const emitter = this.createParticleEmitter(String(color));
        emitter.explode(Number(n));
        return emitter;
      });
    this.scene.time.delayedCall(animationConfig.duration.attack * 2, () => {
      particleEmitters.forEach(pe => pe.destroy());
    });
  }
  private createParticleEmitter(color: string): Phaser.GameObjects.Particles.ParticleEmitter {
    return this.scene.add
      .particles(this.targetCard.x.value2d, this.targetCard.y.value2d, `flare_${color}`, {
        lifespan: animationConfig.attack.flare.lifetime,
        speed: { min: 200, max: 500 },
        scale: { start: 0.8, end: 0 },
        gravityY: 15,
        blendMode: 'ADD',
        emitting: false
      })
      .setDepth(layoutConfig.depth.battleEffect);
  }
  private createIndicator(value: number, color: string) {
    return this.scene.add
      .text(this.targetCard.x.value2d, this.targetCard.y.value2d, String(value))
      .setFontSize(layoutConfig.fontSize.large)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(color)
      .setAlign('center')
      .setOrigin(0.5, 1)
      .setDepth(layoutConfig.depth.battleEffect);
  }
  private tween(target: Phaser.GameObjects.Text) {
    this.scene.tweens.add({
      targets: target,
      duration: animationConfig.attack.indicator.duration,
      y: target.y + animationConfig.attack.indicator.yTween,
      alpha: 0,
      onComplete: () => target.destroy()
    });
  }
}
