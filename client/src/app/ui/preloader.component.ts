import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameSessionService } from '../services/game_session_service';

/**
 * Displays match asset preloading progress and transitions to an opponent-waiting
 * message until the first server state arrives.
 */
@Component({
  selector: 'app-preloader',
  imports: [AsyncPipe],
  templateUrl: './preloader.component.html',
  styleUrl: './preloader.component.scss'
})
export class PreloaderComponent {
  private readonly assetPreloader = inject(AssetPreloaderService);
  private readonly gameSession = inject(GameSessionService);

  readonly vm$ = combineLatest([
    this.gameSession.hasReceivedState$,
    this.gameSession.connectionLost$,
    this.assetPreloader.progress$,
    this.assetPreloader.isComplete$
  ]).pipe(
    map(([hasReceivedState, connectionLost, progress, isComplete]) => ({
      visible: !hasReceivedState && !connectionLost,
      progressPercent: Math.round(Math.min(1, Math.max(0, progress)) * 100),
      statusText: isComplete ? 'Warte auf Gegenspieler...' : 'Lade Spieldaten...'
    }))
  );
}
