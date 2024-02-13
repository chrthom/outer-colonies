import { designConfig } from '../config/design';
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
      .fillStyle(designConfig.tint.player, designConfig.alpha.faded)
      .fillRect(
        layoutConfig.load.preloader.x -
          layoutConfig.load.preloader.width / 2 -
          layoutConfig.load.preloader.boxPadding,
        layoutConfig.load.preloader.y - layoutConfig.load.preloader.boxPadding,
        layoutConfig.load.preloader.width + 2 * layoutConfig.load.preloader.boxPadding,
        layoutConfig.load.preloader.height + 2 * layoutConfig.load.preloader.boxPadding
      );
    this.text = scene.add
      .text(
        layoutConfig.load.preloader.x,
        layoutConfig.load.preloader.y + layoutConfig.load.preloader.textOffsetY,
        'Lade Spieldaten...'
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.text)
      .setColor(designConfig.color.neutral)
      .setAlign('center')
      .setOrigin(0.5, 0.5);
    scene.load.on('progress', (value: number) => {
      this.progressBar
        .clear()
        .fillStyle(designConfig.tint.player, designConfig.alpha.normal)
        .fillRect(
          layoutConfig.load.preloader.x - layoutConfig.load.preloader.width / 2,
          layoutConfig.load.preloader.y,
          layoutConfig.load.preloader.width * value,
          layoutConfig.load.preloader.height
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
