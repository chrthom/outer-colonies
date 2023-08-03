import { layout } from '../config/layout';

export default class LoadingStatus {
  private scene!: Phaser.Scene;
  private text!: Phaser.GameObjects.Text;
  private bars!: Phaser.GameObjects.Shape[];
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.text = scene.add
      .text(
        layout.loadingAnimation.x,
        layout.loadingAnimation.y + layout.loadingAnimation.textOffsetY,
        'Verbinde mit Server...'
      )
      .setFontSize(layout.font.size)
      .setFontFamily(layout.font.textFamily)
      .setColor(layout.font.color)
      .setAlign('center')
      .setOrigin(0.5, 0.5);
    this.createLoadingAnimation();
  }
  setText(text: string): this {
    this.text.setText(text);
    return this;
  }
  private createLoadingAnimation() {
    const height = layout.loadingAnimation.radius * 0.5;
    let angle = -90;
    this.bars = [];
    for (let i = 0; i < 12; ++i) {
      const { x, y } = Phaser.Math.RotateAround(
        {
          x: layout.loadingAnimation.x,
          y: layout.loadingAnimation.y - (layout.loadingAnimation.radius - height * 0.5)
        },
        layout.loadingAnimation.x,
        layout.loadingAnimation.y,
        Phaser.Math.DEG_TO_RAD * angle
      );
      const bar = this.scene.add
        .rectangle(x, y, layout.loadingAnimation.barWidth, height, layout.colors.primary)
        .setAngle(angle)
        .setAlpha(layout.colors.alpha);
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
            alpha: layout.colors.fadedAlpha,
            duration: 400,
            onStart: () => (bar.alpha = layout.colors.alpha)
          });
          tweens.push(tween);
        }
        ++index;
        if (index >= this.bars.length) index = 0;
      }
    });
  }
}
