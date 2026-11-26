import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatchmakingService } from '../services/matchmaking_service';

/**
 * Displays the matchmaking status message and animated radial loading indicator.
 */
@Component({
  selector: 'app-loading-status',
  imports: [AsyncPipe],
  templateUrl: './loading_status.component.html',
  styleUrl: './loading_status.component.scss'
})
export class LoadingStatusComponent {
  readonly bars = Array.from({ length: 12 }, (_, index) => index);
  private readonly matchmakingService = inject(MatchmakingService);
  readonly statusText$ = this.matchmakingService.statusText$;
}
