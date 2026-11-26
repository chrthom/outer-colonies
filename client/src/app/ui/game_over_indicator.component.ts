import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameResultType } from '@shared/config/enums';
import { ClientGameResult } from '@shared/interfaces/client_state';
import { map } from 'rxjs';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameSessionService } from '../services/game_session_service';

/** View-model for the post-game victory/defeat overlay. */
export interface GameOverViewModel {
  won: boolean;
  title: string;
  subtitle: string;
  sol: number;
  imageUrl: string;
}

/**
 * Displays the victory or defeat banner with CSS shadow, shine animation, and Sol reward.
 */
@Component({
  selector: 'app-game-over-indicator',
  imports: [AsyncPipe],
  templateUrl: './game_over_indicator.component.html',
  styleUrl: './game_over_indicator.component.scss'
})
export class GameOverIndicatorComponent {
  private readonly gameSession = inject(GameSessionService);
  private readonly assetPreloader = inject(AssetPreloaderService);

  readonly vm$ = this.gameSession.gameOverResult$.pipe(
    map(result => (result ? this.buildViewModel(result) : undefined))
  );

  private buildViewModel(result: ClientGameResult): GameOverViewModel {
    return {
      won: result.won,
      title: result.won ? 'Sieg' : 'Niederlage',
      subtitle: this.reasonText(result.type),
      sol: result.sol,
      imageUrl: this.assetPreloader.getGameOverImageUrl(result.won)
    };
  }

  private reasonText(type?: GameResultType): string {
    switch (type) {
      case GameResultType.Depletion:
        return 'durch aufgebrauchtes Deck';
      case GameResultType.Destruction:
        return 'durch Zerstörung der Kolonie';
      case GameResultType.Domination:
        return 'durch Vorherrschaft';
      default:
        return 'durch Kapitulation';
    }
  }
}
