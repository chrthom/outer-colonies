import { environment } from 'src/environments/environment';
import { layoutConfig } from '../../config/layout';
import { designConfig } from 'src/app/config/design';
import { version, releaseName } from '../../../../../server/src/shared/config/version';

export default class VersionIndicator {
  constructor(scene: Phaser.Scene) {
    scene.add
      .text(
        layoutConfig.load.version.x,
        layoutConfig.load.version.y,
        `${releaseName} (v${version})${environment.stage != 'production' ? `\nenv: ${environment.stage}` : ''}`
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('right')
      .setOrigin(1);
  }
}
