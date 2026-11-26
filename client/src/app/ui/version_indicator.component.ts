import { Component } from '@angular/core';
import { releaseName, version } from '@shared/config/version';
import { environment } from '../../environments/environment';

/**
 * Displays the current client release name, version, and non-production stage label.
 */
@Component({
  selector: 'app-version-indicator',
  templateUrl: './version_indicator.component.html',
  styleUrl: './version_indicator.component.scss'
})
export class VersionIndicatorComponent {
  readonly versionLabel = `${releaseName} (v${version})`;
  get stageLabel(): string | undefined {
    return environment.stage !== 'production' ? `env: ${environment.stage}` : undefined;
  }
}
