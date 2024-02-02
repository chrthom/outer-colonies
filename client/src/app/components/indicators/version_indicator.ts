import { environment } from 'src/environments/environment';
import { layoutConfig } from '../../config/layout';
import { designConfig } from 'src/app/config/design';

export default class VersonIndicator {
  constructor(scene: Phaser.Scene) {
    scene.add
      .text(
        layoutConfig.load.version.x,
        layoutConfig.load.version.y,
        `Phoebe (v2.0.0)${environment.stage != 'production' ? `\nenv: ${environment.stage}` : ''}`
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.font.captionFamily)
      .setColor(designConfig.font.color)
      .setAlign('right')
      .setOrigin(1, 1);
  }
}
