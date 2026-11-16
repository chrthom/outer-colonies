import { Component, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import AuthService from './auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ImprintPage } from './pages/imprint/imprint.page';
import { DataPrivacyPage } from './pages/data-privacy/data-privacy.page';
import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';
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

  authService = inject(AuthService);
  private dialog = inject(MatDialog);

  readonly bgNo: number;

  constructor() {
    this.bgNo = Math.floor(Math.random() * AppComponent.STAR_BACKGROUND_COUNT);
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
