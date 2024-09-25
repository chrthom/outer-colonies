import { environment } from 'src/environments/environment';
import { layoutConfig } from '../../config/layout';
import { designConfig } from 'src/app/config/design';

export default class VersonIndicator {
  constructor(scene: Phaser.Scene) {
    scene.add
      .text(
        layoutConfig.load.version.x,
        layoutConfig.load.version.y,
        `2.3.0 (vCalypso)${environment.stage != 'production' ? `\nenv: ${environment.stage}` : ''}`
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('right')
      .setOrigin(1);
  }
}
