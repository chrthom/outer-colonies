import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DailyApiService } from 'src/app/api/daily-api.service';
import AuthService from 'src/app/auth.service';
import { environment } from 'src/environments/environment';
import { DailyGetResponse } from '@shared/interfaces/rest_api';
import { DAILY_DEFINITIONS } from '@shared/config/dailies';
import { ContentBoxComponent } from '../../../components/content-box/content-box.component';
import { MatAnchor } from '@angular/material/button';
import { MatTabGroup, MatTab } from '@angular/material/tabs';

@Component({
  selector: 'oc-page-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [ContentBoxComponent, MatAnchor, MatTabGroup, MatTab]
})
export class HomePage implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private dailyApiService = inject(DailyApiService);

  dailies: Daily[] = this.generateDailiesArray();
  selectedDaily = 1;
  private autoAdvanceInterval: ReturnType<typeof setInterval> | undefined;

  ngOnInit() {
    this.reload();
    this.startAutoAdvance();
  }

  ngOnDestroy() {
    if (this.autoAdvanceInterval) {
      clearInterval(this.autoAdvanceInterval);
      this.autoAdvanceInterval = undefined;
    }
  }

  reload() {
    this.dailyApiService.dailies.subscribe({
      next: res => {
        const availableDailyKeys = this.getAvailableDailyKeys(res);

        this.dailies = this.dailies
          .map(daily => {
            const achieved = daily.matcher(res);
            return { ...daily, achieved };
          })
          .filter(daily => availableDailyKeys.includes(daily.key));

        // Keep the selected tab inside the filtered array
        if (this.selectedDaily >= this.dailies.length) {
          this.selectedDaily = 0;
        }

        // Restart auto-advance so its cycle matches the filtered array
        if (this.autoAdvanceInterval) {
          this.resetAutoAdvance();
        }
      },
      error: err => {
        /* The swallow is mandatory: RxJS rethrows errors of handler-less subscriptions as
           uncaught exceptions. The failure is logged with a level (gated to non-production
           stages) and the default dailies list is kept */
        if (environment.stage !== 'production') {
          console.warn(`Failed to load dailies with status ${err?.status}, keeping default dailies list`);
        }
      }
    });
  }

  /** Base URL of the game client (without the session token). */
  get gameUrl(): string {
    return environment.url.game;
  }

  /**
   * Link to the game client for the next match. The session token is passed as
   * the `token` query parameter, which the client's matchmaking scene parses.
   */
  get gameLink(): string {
    return `${this.gameUrl}/?token=${encodeURIComponent(this.authService.token)}`;
  }

  /** Advances the selection to the next daily, cycling against the current dailies array. */
  private showNextDaily() {
    this.selectedDaily = (this.selectedDaily + 1) % this.dailies.length;
  }

  private startAutoAdvance() {
    this.autoAdvanceInterval = setInterval(() => this.showNextDaily(), 3000);
  }

  /** Clears and restarts the auto-advance interval, e.g. after a reload or manual tab change. */
  resetAutoAdvance() {
    if (this.autoAdvanceInterval) {
      clearInterval(this.autoAdvanceInterval);
    }
    this.startAutoAdvance();
  }

  /** Returns the daily keys the server did not null out, i.e. those available today. */
  private getAvailableDailyKeys(response: DailyGetResponse): (keyof DailyGetResponse)[] {
    const availableKeys: (keyof DailyGetResponse)[] = [];
    for (const key in response) {
      if (response[key as keyof DailyGetResponse] !== null) {
        availableKeys.push(key as keyof DailyGetResponse);
      }
    }
    return availableKeys;
  }

  /** Builds the dailies list from the centralized daily definitions. */
  private generateDailiesArray(): Daily[] {
    return DAILY_DEFINITIONS.map(dailyDef => ({
      key: dailyDef.dbColumn,
      matcher: (r: DailyGetResponse) => Boolean(r[dailyDef.dbColumn as keyof DailyGetResponse] ?? false),
      title: dailyDef.title,
      description: dailyDef.description,
      sol: dailyDef.solReward
    }));
  }
}

interface Daily {
  key: string;
  matcher: (dailiesAchieved: DailyGetResponse) => boolean;
  title: string;
  description: string;
  sol: number;
  achieved?: boolean;
}
