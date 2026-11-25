import { AsyncPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { map, startWith } from 'rxjs';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';

/**
 * Displays the player's or opponent's remaining action pool icons along the right HUD edge.
 */
@Component({
  selector: 'app-action-pool',
  imports: [AsyncPipe],
  templateUrl: './action_pool.component.html',
  styleUrl: './action_pool.component.scss'
})
export class ActionPoolComponent {
  @Input() ownedByPlayer = true;

  private readonly gameSession = inject(GameSessionService);
  private readonly interaction = inject(GameInteractionService);
  private readonly assetPreloader = inject(AssetPreloaderService);

  readonly actions$ = this.interaction.hudRefresh$.pipe(
    startWith(undefined),
    map(() =>
      this.gameSession.getPlayerState(this.ownedByPlayer).actionPool.map((action, index) => ({
        key: `${index}-${action}`,
        name: action,
        iconUrl: this.assetPreloader.getIconUrl(action)
      }))
    )
  );
}
