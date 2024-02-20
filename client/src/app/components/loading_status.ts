import { designConfig } from '../config/design';
import { layoutConfig } from '../config/layout';

export default class LoadingStatus {
  private scene!: Phaser.Scene;
  private text!: Phaser.GameObjects.Text;
  private bars!: Phaser.GameObjects.Shape[];
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.text = scene.add
      .text(
        layoutConfig.load.loadingAnimation.x,
        layoutConfig.load.loadingAnimation.y + layoutConfig.load.loadingAnimation.textOffsetY,
        'Verbinde mit Server...'
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.text)
      .setColor(designConfig.color.neutral)
      .setAlign('center')
      .setOrigin(0.5);
    this.createLoadingAnimation();
  }
  setText(text: string): this {
    this.text.setText(text);
    return this;
  }
  private createLoadingAnimation() {
    const height = layoutConfig.load.loadingAnimation.radius * 0.5;
    let angle = -90;
    this.bars = [];
    for (let i = 0; i < 12; ++i) {
      const { x, y } = Phaser.Math.RotateAround(
        {
          x: layoutConfig.load.loadingAnimation.x,
          y: layoutConfig.load.loadingAnimation.y - (layoutConfig.load.loadingAnimation.radius - height * 0.5)
        },
        layoutConfig.load.loadingAnimation.x,
        layoutConfig.load.loadingAnimation.y,
        Phaser.Math.DEG_TO_RAD * angle
      );
      const bar = this.scene.add
        .rectangle(x, y, layoutConfig.load.loadingAnimation.barWidth, height, designConfig.tint.player)
        .setAngle(angle)
        .setAlpha(designConfig.alpha.normal);
      this.bars.push(bar);
      angle += 30;
    }
    let index = 0;
    const tweens: Phaser.Tweens.Tween[] = [];
    this.scene.time.addEvent({
      delay: 70,
      loop: true,
      callback: () => {
        if (index < tweens.length) {
          const tween = tweens[index];
          tween.restart();
        } else {
          const bar = this.bars[index];
          const tween = this.scene.tweens.add({
            repeat: -1,
            targets: bar,
            alpha: designConfig.tint.faded,
            duration: 400,
            onStart: () => (bar.alpha = designConfig.alpha.normal)
          });
          tweens.push(tween);
        }
        ++index;
        if (index >= this.bars.length) index = 0;
      }
    });
  }
}
