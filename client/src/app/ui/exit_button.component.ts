import { AsyncPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { map, merge } from 'rxjs';
import { environment } from '../../environments/environment';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { ExitButtonViewModel, GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { MatchmakingService } from '../services/matchmaking_service';
import { NavigationService } from '../services/navigation_service';

/**
 * Exit / surrender action button with inline confirmation during active matches.
 */
@Component({
  selector: 'app-exit-button',
  imports: [AsyncPipe],
  templateUrl: './exit_button.component.html',
  styleUrl: './exit_button.component.scss'
})
export class ExitButtonComponent {
  @Input() mode: 'matchmaking' | 'game' = 'game';

  private readonly matchmakingService = inject(MatchmakingService);
  private readonly gameSession = inject(GameSessionService);
  private readonly interaction = inject(GameInteractionService);
  private readonly navigation = inject(NavigationService);
  private readonly assetPreloader = inject(AssetPreloaderService);

  confirming = false;
  readonly iconUrl = this.assetPreloader.getIconUrl('exit');
  readonly promptVisible$ = this.interaction.promptVisible$;
  readonly vm$ = merge(this.interaction.hudRefresh$, this.gameSession.stateReceived$).pipe(
    map(() => this.computeViewModel())
  );

  /** Current derived exit button view-model. */
  get currentViewModel(): ExitButtonViewModel {
    return this.computeViewModel();
  }

  /** Handles clicking the primary exit/cancel/surrender button. */
  onPrimaryClick(): void {
    if (this.mode === 'matchmaking') {
      this.matchmakingService.cancel();
      this.navigation.navigateTo(environment.urls.website);
      return;
    }

    const vm = this.computeViewModel();
    if (!vm.canSurrender) {
      this.confirming = false;
      this.gameSession.leaveMatch();
      this.navigation.navigateTo(environment.urls.website);
      return;
    }

    this.confirming = !this.confirming;
  }

  /** Confirms surrender after opening the inline confirmation control. */
  onConfirmSurrender(): void {
    if (this.mode !== 'game' || !this.computeViewModel().canSurrender) return;
    this.confirming = false;
    this.interaction.surrender();
  }

  private computeViewModel(): ExitButtonViewModel {
    if (this.mode === 'matchmaking') {
      return { label: 'Spielersuche abbrechen', canSurrender: false };
    }
    const vm = this.interaction.getExitButtonState();
    if (!vm.canSurrender) {
      this.confirming = false;
    }
    return vm;
  }
}
