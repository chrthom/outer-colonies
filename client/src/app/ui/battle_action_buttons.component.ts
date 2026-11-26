import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BattleType } from '@shared/config/enums';
import { map, startWith } from 'rxjs';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';

/**
 * Renders the Mission and Überfall declaration buttons during the active player's build phase.
 */
@Component({
  selector: 'app-battle-action-buttons',
  imports: [AsyncPipe],
  templateUrl: './battle_action_buttons.component.html',
  styleUrl: './battle_action_buttons.component.scss'
})
export class BattleActionButtonsComponent {
  readonly BattleType = BattleType;

  private readonly interaction = inject(GameInteractionService);
  private readonly assetPreloader = inject(AssetPreloaderService);

  readonly missionIconUrl = this.assetPreloader.getIconUrl('mission');
  readonly raidIconUrl = this.assetPreloader.getIconUrl('raid');

  readonly vm$ = this.interaction.hudRefresh$.pipe(
    startWith(undefined),
    map(() => ({
      visible: this.interaction.canShowBattleActionButtons(),
      plannedType: this.interaction.plannedBattle.type
    }))
  );

  /** Toggles planning a mission or raid in `GameInteractionService`. */
  toggle(battleType: BattleType): void {
    this.interaction.togglePlannedBattle(battleType);
  }
}
