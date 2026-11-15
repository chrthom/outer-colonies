import { environment } from 'src/environments/environment';
import { layoutConfig } from '../../config/layout';
import { designConfig } from 'src/app/config/design';
import pkg from '../../../../package.json';

/** Release name of the current version; kept in sync by misc/release/version.sh. */
const releaseName = 'Pan';

/** Version from package.json; single source of truth for the displayed version. */
const version = pkg.version;

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
