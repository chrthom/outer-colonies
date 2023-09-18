import { environment } from 'src/environments/environment';
import { layoutConfig } from '../../config/layout';

export default class VersonIndicator {
  constructor(scene: Phaser.Scene) {
    scene.add
      .text(
        layoutConfig.version.x,
        layoutConfig.version.y,
        `Iapetus (v1.7.0)${environment.stage != 'production' ? `\nenv: ${environment.stage}` : ''}`
      )
      .setFontSize(layoutConfig.font.size)
      .setFontFamily(layoutConfig.font.captionFamily)
      .setColor(layoutConfig.font.color)
      .setAlign('right')
      .setOrigin(1, 1);
  }
}
