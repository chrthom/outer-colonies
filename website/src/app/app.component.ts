import { Component, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ImprintPage } from './pages/public/imprint/imprint.page';
import { DataPrivacyPage } from './pages/public/data-privacy/data-privacy.page';
import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';
import AuthService from './auth.service';
import { version, releaseName } from '@shared/config/version';

@Component({
  selector: 'oc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [NavbarComponent, RouterOutlet]
})
export class AppComponent {
  /** Number of star background images (background-stars-0 … background-stars-6 in app.component.scss). */
  private static readonly STAR_BACKGROUND_COUNT = 7;

  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  readonly bgNo: number;

  constructor() {
    this.bgNo = Math.floor(Math.random() * AppComponent.STAR_BACKGROUND_COUNT);
    // Restore a cookie session on startup so the navbar shows the real login state even on public pages,
    // where no route guard triggers the session check.
    this.authService.check().subscribe();
  }
  get env() {
    return environment;
  }
  get version() {
    return version;
  }
  get releaseName() {
    return releaseName;
  }
  openImprint() {
    this.dialog.open(ImprintPage);
  }
  openDataPrivacy() {
    this.dialog.open(DataPrivacyPage);
  }
}
