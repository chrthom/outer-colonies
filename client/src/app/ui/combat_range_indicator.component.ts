import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rules } from '@shared/config/rules';
import { map, startWith } from 'rxjs';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';

/**
 * Displays the active combat range badge when a battle is visible.
 */
@Component({
  selector: 'app-combat-range-indicator',
  imports: [AsyncPipe],
  templateUrl: './combat_range_indicator.component.html',
  styleUrl: './combat_range_indicator.component.scss'
})
export class CombatRangeIndicatorComponent {
  private readonly interaction = inject(GameInteractionService);
  private readonly assetPreloader = inject(AssetPreloaderService);

  readonly range$ = this.interaction.hudRefresh$.pipe(
    startWith(undefined),
    map(() => {
      const range = this.interaction.getVisibleCombatRange();
      if (range === undefined || range < 1 || range > rules.maxRange) return undefined;
      return {
        range,
        imageUrl: this.assetPreloader.getRangeIndicatorUrl(range)
      };
    })
  );
}
