import { layoutConfig } from '../config/layout';
import Game from '../scenes/game';

export default class Preloader {
  progressBar!: Phaser.GameObjects.Graphics;
  progressBox!: Phaser.GameObjects.Graphics;
  text!: Phaser.GameObjects.Text;
  constructor(scene: Game) {
    this.progressBar = scene.add.graphics();
    this.progressBox = scene.add
      .graphics()
      .fillStyle(layoutConfig.colors.primary, layoutConfig.colors.fadedAlpha)
      .fillRect(
        layoutConfig.preloader.x - layoutConfig.preloader.width / 2 - layoutConfig.preloader.boxPadding,
        layoutConfig.preloader.y - layoutConfig.preloader.boxPadding,
        layoutConfig.preloader.width + 2 * layoutConfig.preloader.boxPadding,
        layoutConfig.preloader.height + 2 * layoutConfig.preloader.boxPadding
      );
    this.text = scene.add
      .text(
        layoutConfig.preloader.x,
        layoutConfig.preloader.y + layoutConfig.preloader.textOffsetY,
        'Lade Spieldaten...'
      )
      .setFontSize(layoutConfig.font.size)
      .setFontFamily(layoutConfig.font.textFamily)
      .setColor(layoutConfig.font.color)
      .setAlign('center')
      .setOrigin(0.5, 0.5);
    scene.load.on('progress', (value: number) => {
      this.progressBar
        .clear()
        .fillStyle(layoutConfig.colors.primary, layoutConfig.colors.alpha)
        .fillRect(
          layoutConfig.preloader.x - layoutConfig.preloader.width / 2,
          layoutConfig.preloader.y,
          layoutConfig.preloader.width * value,
          layoutConfig.preloader.height
        );
    });
    scene.load.on('complete', () => {
      console.log('Ready to play');
      this.text.setText('Warte auf Gegenspieler...');
    });
  }
  destroy() {
    this.progressBar.destroy();
    this.progressBox.destroy();
    this.text.destroy();
  }
}
