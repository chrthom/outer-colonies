import { Component, OnInit, inject } from '@angular/core';
import { DailyApiService } from 'src/app/api/daily-api.service';
import AuthService from 'src/app/auth.service';
import { environment } from 'src/environments/environment';
import { DailyGetResponse } from '../../../../../server/src/shared/interfaces/rest_api';
import { rules } from '../../../../../server/src/shared/config/rules';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatAnchor } from '@angular/material/button';
import { MatTabGroup, MatTab } from '@angular/material/tabs';

// Helper function to determine which dailies are available today
function getAvailableDailyKeys(response: DailyGetResponse): (keyof DailyGetResponse)[] {
  const availableKeys: (keyof DailyGetResponse)[] = [];
  for (const key in response) {
    if (response[key as keyof DailyGetResponse] !== null) {
      availableKeys.push(key as keyof DailyGetResponse);
    }
  }
  return availableKeys;
}

@Component({
  selector: 'oc-page-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [ContentBoxComponent, MatAnchor, MatTabGroup, MatTab]
})
export class HomePage implements OnInit {
  authService = inject(AuthService);
  private dailyApiService = inject(DailyApiService);

  dailies: Daily[] = [
    {
      matcher: r => r.login ?? false,
      title: 'Tägliche Inspektion',
      description: 'Melde dich im Online Portal an.',
      sol: rules.dailyEarnings.login
    },
    {
      matcher: r => r.victory ?? false,
      title: 'Der Duft des Sieges',
      description: 'Erringe einen Sieg.',
      sol: rules.dailyEarnings.victory
    },
    {
      matcher: r => r.game ?? false,
      title: 'Bis zum bitteren Ende',
      description: 'Beende en Spiel, ohne dass ein Spieler kapituliert.',
      sol: rules.dailyEarnings.game
    },
    {
      matcher: r => r.energy ?? false,
      title: 'Bereit zur Expansion',
      description: 'Beende ein Spiel mit mindestens 6 überschüssigen Energiepunkten.',
      sol: rules.dailyEarnings.energy
    },
    {
      matcher: r => r.ships ?? false,
      title: 'Armada',
      description: 'Beende ein Spiel mit mindestens 5 eigenen Schiffen.',
      sol: rules.dailyEarnings.ships
    },
    {
      matcher: r => r.domination ?? false,
      title: 'Vorherrschaft',
      description: 'Erringe einen Sieg durch Vorherrschaft.',
      sol: rules.dailyEarnings.domination
    },
    {
      matcher: r => r.destruction ?? false,
      title: 'Keine Gefangenen',
      description: 'Erringe einen Sieg durch Zerstöring der gegnerischen Kolonie.',
      sol: rules.dailyEarnings.destruction
    },
    {
      matcher: r => r.control ?? false,
      title: 'Potentes Einsatzteam',
      description: 'Beende ein Spiel mit mindestens 6 Kontrollpunkten durch deine Schiffe.',
      sol: rules.dailyEarnings.control
    },
    {
      matcher: r => r.juggernaut ?? false,
      title: 'Juggernaut',
      description: 'Besitze zum Spielende ein Schiff mit mindestens 20 Hüllenpunkten.',
      sol: rules.dailyEarnings.juggernaut
    },
    {
      matcher: r => r.stations ?? false,
      title: 'Ich bleibe hier',
      description: 'Besitze zum Spielende 3 oder mehr Hüllenkarten mit Geschwindigkeit 0.',
      sol: rules.dailyEarnings.stations
    },
    {
      matcher: r => r.discard ?? false,
      title: 'Der lange Krieg',
      description: 'Lege mindestens 50 Karten in einem Spiel ab.',
      sol: rules.dailyEarnings.discard
    },
    {
      matcher: r => r.colony ?? false,
      title: 'Sweet Home',
      description: 'Habe zum SPielende mindestens 7 Koloniekarten in deiner Koloniezone.',
      sol: rules.dailyEarnings.colony
    },
    {
      matcher: r => r.colossus ?? false,
      title: 'Der Koloss',
      description: 'Besitze zum Spielende ein Schiffe, das aus mindestens 7 Karten besteht.',
      sol: rules.dailyEarnings.colossus
    }
  ];
  selectedDaily = 1;
  ngOnInit() {
    this.reload();
    setInterval(this.showNextDaily(this.dailies.length), 3000);
  }
  reload() {
    this.dailyApiService.dailies.subscribe(res => {
      const availableDailyKeys = getAvailableDailyKeys(res);

      // Filter dailies to only show those that are available today
      this.dailies = this.dailies
        .map(daily => {
          const achieved = daily.matcher(res);
          return { ...daily, achieved };
        })
        .filter(daily => {
          // Extract the daily key from the matcher function
          const matcherStr = daily.matcher.toString();
          const match = matcherStr.match(/r\.(\w+)/);
          const dailyKey = match ? match[1] : null;

          // Show daily if it's available today (not null)
          return dailyKey ? availableDailyKeys.includes(dailyKey as keyof DailyGetResponse) : false;
        });

      // Ensure we have at least one daily to show
      if (this.dailies.length === 0) {
        // Fallback: show all dailies if none are available (shouldn't happen)
        this.dailies = this.dailies.map(daily => {
          const achieved = daily.matcher(res);
          return { ...daily, achieved };
        });
      }
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
