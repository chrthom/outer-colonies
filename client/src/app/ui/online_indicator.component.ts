import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { MatchmakingService } from '../services/matchmaking_service';

/**
 * Persistent display of the number of unique online players during matchmaking.
 */
@Component({
  selector: 'app-online-indicator',
  imports: [AsyncPipe],
  templateUrl: './online_indicator.component.html',
  styleUrl: './online_indicator.component.scss'
})
export class OnlineIndicatorComponent {
  private readonly matchmakingService = inject(MatchmakingService);
  readonly text$ = this.matchmakingService.onlineCount$.pipe(
    map(count => (count !== undefined ? `${count} Spieler online` : undefined))
  );
}
