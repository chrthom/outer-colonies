import { Component, OnInit, inject } from '@angular/core';
import { DailyApiService } from 'src/app/api/daily-api.service';
import AuthService from 'src/app/auth.service';
import { environment } from 'src/environments/environment';
import { DailyGetResponse } from '../../../../../server/src/shared/interfaces/rest_api';
import { DAILY_DEFINITIONS } from '../../../../../server/src/shared/config/dailies';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatAnchor } from '@angular/material/button';
import { MatTabGroup, MatTab } from '@angular/material/tabs';

@Component({
  selector: 'oc-page-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [ContentBoxComponent, MatAnchor, MatTabGroup, MatTab]
})
export class HomePage implements OnInit {
  authService = inject(AuthService);
  private dailyApiService = inject(DailyApiService);

  dailies: Daily[] = this.generateDailiesArray();
  selectedDaily = 1;

  ngOnInit() {
    this.reload();
    setInterval(this.showNextDaily(this.dailies.length), 3000);
  }

  reload() {
    this.dailyApiService.dailies.subscribe(res => {
      const availableDailyKeys = this.getAvailableDailyKeys(res);

      // Filter dailies to only show those that are available today
      this.dailies = this.dailies
        .map(daily => {
          const achieved = daily.matcher(res);
          return { ...daily, achieved };
        })
        .filter(daily => {
          // Extract the daily key from the matcherStr property
          const matcherStr = daily.matcherStr || daily.matcher.toString();
          const match = matcherStr.match(/r\.(\w+)/);
          const dailyKey = match ? match[1] : null;

          // Show daily if it's available today (not null)
          return dailyKey ? availableDailyKeys.includes(dailyKey as keyof DailyGetResponse) : false;
        });
    });
  }

  get gameUrl(): string {
    return environment.url.game;
  }

  private showNextDaily(length: number) {
    return () => {
      if (++this.selectedDaily >= length) this.selectedDaily = 0;
    };
  }

  // Helper function to determine which dailies are available today
  private getAvailableDailyKeys(response: DailyGetResponse): (keyof DailyGetResponse)[] {
    const availableKeys: (keyof DailyGetResponse)[] = [];
    for (const key in response) {
      if (response[key as keyof DailyGetResponse] !== null) {
        availableKeys.push(key as keyof DailyGetResponse);
      }
    }
    return availableKeys;
  }

  // Generate dailies array dynamically from centralized definitions
  private generateDailiesArray(): Daily[] {
    return DAILY_DEFINITIONS.map(dailyDef => ({
      matcher: (r: DailyGetResponse) => Boolean(r[dailyDef.dbColumn as keyof DailyGetResponse] ?? false),
      matcherStr: `r.${dailyDef.dbColumn}`, // For compatibility with existing filtering logic
      title: dailyDef.title,
      description: dailyDef.description,
      sol: dailyDef.solReward
    }));
  }
}

interface Daily {
  matcher: (dailiesAchieved: DailyGetResponse) => boolean;
  matcherStr?: string;
  title: string;
  description: string;
  sol: number;
  achieved?: boolean;
}
