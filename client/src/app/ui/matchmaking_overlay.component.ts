import { Component } from '@angular/core';
import { ExitButtonComponent } from './exit_button.component';
import { LoadingStatusComponent } from './loading_status.component';
import { OnlineIndicatorComponent } from './online_indicator.component';
import { VersionIndicatorComponent } from './version_indicator.component';

/**
 * Matchmaking overlay rendering loading status, online player count, version info,
 * and search cancellation button above the Phaser space background.
 */
@Component({
  selector: 'app-matchmaking-overlay',
  imports: [LoadingStatusComponent, OnlineIndicatorComponent, VersionIndicatorComponent, ExitButtonComponent],
  templateUrl: './matchmaking_overlay.component.html',
  styleUrl: './matchmaking_overlay.component.scss'
})
export class MatchmakingOverlayComponent {}
