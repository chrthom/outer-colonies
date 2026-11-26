import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { combineLatest, map, startWith } from 'rxjs';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';

/**
 * Displays contextual phase/waiting instructions in the right HUD column.
 */
@Component({
  selector: 'app-prompt',
  imports: [AsyncPipe],
  templateUrl: './prompt.component.html',
  styleUrl: './prompt.component.scss'
})
export class PromptComponent {
  private readonly interaction = inject(GameInteractionService);
  private readonly assetPreloader = inject(AssetPreloaderService);

  readonly boxUrl = this.assetPreloader.getPromptBoxUrl();

  readonly vm$ = combineLatest([
    this.interaction.promptVisible$,
    this.interaction.hudRefresh$.pipe(startWith(undefined))
  ]).pipe(
    map(([visible]) => {
      const state = this.interaction.getPromptState();
      return {
        visible: visible && !state.isGameOver,
        text: state.text
      };
    })
  );
}
