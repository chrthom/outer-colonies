import { layoutConfig } from '../config/layout';

export default class LoadingStatus {
  private scene!: Phaser.Scene;
  private text!: Phaser.GameObjects.Text;
  private bars!: Phaser.GameObjects.Shape[];
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.text = scene.add
      .text(
        layoutConfig.loadingAnimation.x,
        layoutConfig.loadingAnimation.y + layoutConfig.loadingAnimation.textOffsetY,
        'Verbinde mit Server...'
      )
      .setFontSize(layoutConfig.font.size)
      .setFontFamily(layoutConfig.font.textFamily)
      .setColor(layoutConfig.font.color)
      .setAlign('center')
      .setOrigin(0.5, 0.5);
    this.createLoadingAnimation();
  }
  setText(text: string): this {
    this.text.setText(text);
    return this;
  }
  private createLoadingAnimation() {
    const height = layoutConfig.loadingAnimation.radius * 0.5;
    let angle = -90;
    this.bars = [];
    for (let i = 0; i < 12; ++i) {
      const { x, y } = Phaser.Math.RotateAround(
        {
          x: layoutConfig.loadingAnimation.x,
          y: layoutConfig.loadingAnimation.y - (layoutConfig.loadingAnimation.radius - height * 0.5)
        },
        layoutConfig.loadingAnimation.x,
        layoutConfig.loadingAnimation.y,
        Phaser.Math.DEG_TO_RAD * angle
      );
      const bar = this.scene.add
        .rectangle(x, y, layoutConfig.loadingAnimation.barWidth, height, layoutConfig.colors.primary)
        .setAngle(angle)
        .setAlpha(layoutConfig.colors.alpha);
      this.bars.push(bar);
      angle += 30;
    }
    let index = 0;
    const tweens = [];
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
            alpha: layoutConfig.colors.fadedAlpha,
            duration: 400,
            onStart: () => (bar.alpha = layoutConfig.colors.alpha)
          });
          tweens.push(tween);
        }
        ++index;
        if (index >= this.bars.length) index = 0;
      }
    });
  }
}
