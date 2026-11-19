import { layoutConfig } from '../../config/layout';
import { designConfig } from 'src/app/config/design';

/** Persistent display of the number of online players, independent of the loading status text. */
export default class OnlineIndicator {
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(layoutConfig.load.onlineCount.x, layoutConfig.load.onlineCount.y, '')
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('right')
      .setOrigin(1);
  }

  /**
   * Updates the displayed number of online players.
   * @param count number of unique logged-in players
   */
  setCount(count: number): void {
    this.text.setText(`${count} Spieler online`);
  }
}
