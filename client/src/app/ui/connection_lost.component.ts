import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rules } from '@shared/config/rules';
import { combineLatest, map } from 'rxjs';
import { GameSessionService } from '../services/game_session_service';

/**
 * Displays the mid-game disconnect and reload notice during the reconnection grace window.
 */
@Component({
  selector: 'app-connection-lost',
  imports: [AsyncPipe],
  templateUrl: './connection_lost.component.html',
  styleUrl: './connection_lost.component.scss'
})
export class ConnectionLostComponent {
  private readonly gameSession = inject(GameSessionService);

  readonly message =
    'Verbindung verloren.\n' +
    'Bitte Seite neu laden, um das Spiel fortzusetzen.\n' +
    `Das Spiel endet ${rules.reconnectGracePeriod} Sekunden nach dem Verbindungsabbruch.`;

  readonly visible$ = combineLatest([this.gameSession.connectionLost$, this.gameSession.state$]).pipe(
    map(([connectionLost, state]) => connectionLost && !state.gameResult)
  );
}
