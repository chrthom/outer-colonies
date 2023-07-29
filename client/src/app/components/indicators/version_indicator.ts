import { environment } from 'src/environments/environment';
import { layout } from '../../config/layout';

export default class VersonIndicator {
  constructor(scene: Phaser.Scene) {
    scene.add
      .text(
        layout.version.x,
        layout.version.y,
        `Tethys (1.3)${environment.stage != 'production' ? `\nenv: ${environment.stage}` : ''}`
      )
      .setFontSize(layout.font.size)
      .setFontFamily(layout.font.captionFamily)
      .setColor(layout.font.color)
      .setAlign('right')
      .setOrigin(1, 1);
  }
}
