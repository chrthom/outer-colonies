import { AsyncPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { GameSessionService } from '../services/game_session_service';

/**
 * Displays a player's name and optional active turn countdown timer.
 */
@Component({
  selector: 'app-countdown-indicator',
  imports: [AsyncPipe],
  templateUrl: './countdown_indicator.component.html',
  styleUrl: './countdown_indicator.component.scss'
})
export class CountdownIndicatorComponent {
  @Input() ownedByPlayer = true;

  private readonly gameSession = inject(GameSessionService);

  readonly vm$ = combineLatest([this.gameSession.state$, this.gameSession.countdown$]).pipe(
    map(([state, countdownState]) => {
      const player = this.ownedByPlayer ? state.player : state.opponent;
      const countdown = this.ownedByPlayer ? countdownState.player : countdownState.opponent;
      const prefix = countdown ? `${this.formatCountdown(countdown)}  ` : '';
      return {
        text: `${prefix}${player.name}`,
        warning: Boolean(countdown && countdown < 60)
      };
    })
  );

  private formatCountdown(countdown: number): string {
    return `[${this.twoDigit(Math.floor(countdown / 60))}:${this.twoDigit(countdown % 60)}]`;
  }

  private twoDigit(value: number): string {
    return `0${value}`.slice(-2);
  }
}
