import { Component } from '@angular/core';
import { ActionPoolComponent } from './action_pool.component';
import { BattleActionButtonsComponent } from './battle_action_buttons.component';
import { CombatRangeIndicatorComponent } from './combat_range_indicator.component';
import { ConnectionLostComponent } from './connection_lost.component';
import { ContinueButtonComponent } from './continue_button.component';
import { CountdownIndicatorComponent } from './countdown_indicator.component';
import { ExitButtonComponent } from './exit_button.component';
import { GameOverIndicatorComponent } from './game_over_indicator.component';
import { PreloaderComponent } from './preloader.component';
import { PromptComponent } from './prompt.component';
import { ZoomCardComponent } from './zoom_card.component';

/**
 * In-game Angular HUD and stage overlay container layered above the Phaser card board.
 */
@Component({
  selector: 'app-game-hud',
  imports: [
    PreloaderComponent,
    ActionPoolComponent,
    CountdownIndicatorComponent,
    CombatRangeIndicatorComponent,
    BattleActionButtonsComponent,
    ContinueButtonComponent,
    ExitButtonComponent,
    PromptComponent,
    ZoomCardComponent,
    GameOverIndicatorComponent,
    ConnectionLostComponent
  ],
  templateUrl: './game_hud.component.html',
  styleUrl: './game_hud.component.scss'
})
export class GameHudComponent {}
