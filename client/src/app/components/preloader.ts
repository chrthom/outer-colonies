import { designConfig } from '../config/design';
import { layoutConfig } from '../config/layout';
import Game from '../scenes/game';

export default class Preloader {
  private scene: Game;
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBox?: Phaser.GameObjects.Graphics;
  private text?: Phaser.GameObjects.Text;
  private readonly onProgress: (value: number) => void;
  private readonly onComplete: () => void;

  constructor(scene: Game) {
    this.scene = scene;
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
      .setOrigin(0.5);
    this.onProgress = (value: number) => {
      this.progressBar
        ?.clear()
        .fillStyle(designConfig.tint.player, designConfig.alpha.normal)
        .fillRect(
          layoutConfig.load.preloader.x - layoutConfig.load.preloader.width / 2,
          layoutConfig.load.preloader.y,
          layoutConfig.load.preloader.width * value,
          layoutConfig.load.preloader.height
        );
    };
    this.onComplete = () => {
      console.log('Ready to play');
      this.text?.setText('Warte auf Gegenspieler...');
    };
    scene.load.on('progress', this.onProgress);
    scene.load.on('complete', this.onComplete);
  }

  /**
   * Destroys the preloader's game objects and removes its loader listeners.
   * Safe to call repeatedly: subsequent calls are no-ops.
   */
  destroy() {
    if (!this.progressBar) return;
    this.scene.load.off('progress', this.onProgress);
    this.scene.load.off('complete', this.onComplete);
    this.progressBar.destroy();
    this.progressBox?.destroy();
    this.text?.destroy();
    this.progressBar = undefined;
    this.progressBox = undefined;
    this.text = undefined;
  }
}
