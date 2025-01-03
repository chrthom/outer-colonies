import { Component, OnInit } from '@angular/core';
import { DailyApiService } from 'src/app/api/daily-api.service';
import AuthService from 'src/app/auth.service';
import { environment } from 'src/environments/environment';
import { DailyGetResponse } from '../../../../../server/src/shared/interfaces/rest_api';
import { rules } from '../../../../../server/src/shared/config/rules';

@Component({
    selector: 'oc-page-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  dailies: Daily[] = [
    {
      matcher: r => r.login,
      title: 'Tägliche Inspektion',
      description: 'Melde dich im Online Portal an.',
      sol: rules.dailyEarnings.login
    },
    {
      matcher: r => r.victory,
      title: 'Der Duft des Sieges',
      description: 'Erringe einen Sieg.',
      sol: rules.dailyEarnings.victory
    },
    {
      matcher: r => r.game,
      title: 'Bis zum bitteren Ende',
      description: 'Beende en Spiel, ohne dass ein Spieler kapituliert.',
      sol: rules.dailyEarnings.game
    },
    {
      matcher: r => r.energy,
      title: 'Bereit zur Expansion',
      description: 'Beende ein Spiel mit mindestens 6 überschüssigen Energiepunkten.',
      sol: rules.dailyEarnings.energy
    },
    {
      matcher: r => r.ships,
      title: 'Armada',
      description: 'Beende ein Spiel mit mindestens 5 eigenen Schiffen.',
      sol: rules.dailyEarnings.ships
    }
  ];
  selectedDaily = 1;
  constructor(
    public authService: AuthService,
    private dailyApiService: DailyApiService
  ) {}
  ngOnInit() {
    this.reload();
    setInterval(this.showNextDaily(this.dailies.length), 3000);
  }
  reload() {
    this.dailyApiService.dailies.subscribe(res => {
      this.dailies = this.dailies.map(daily => {
        daily.achieved = daily.matcher(res);
        return daily;
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
}

interface Daily {
  matcher: (dailiesAchieved: DailyGetResponse) => boolean;
  title: string;
  description: string;
  sol: number;
  achieved?: boolean;
}
