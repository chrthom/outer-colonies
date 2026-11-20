import { Component, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterLink, RouterOutlet } from '@angular/router';
import AuthService from './auth.service';
import { version, releaseName } from '@shared/config/version';

@Component({
  selector: 'oc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', './background.scss'],
  imports: [NavbarComponent, RouterLink, RouterOutlet]
})
export class AppComponent {
  /** Number of star background images (background-stars-0 … background-stars-6 in background.scss). */
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

  /** Moves focus and the viewport to the start of the page content. */
  focusMainContent(mainContent: HTMLElement): void {
    mainContent.scrollIntoView({ block: 'start' });
    mainContent.focus({ preventScroll: true });
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
  /** Loads and opens the imprint dialog on demand. */
  async openImprint(): Promise<void> {
    const { ImprintPage } = await import('./pages/public/imprint/imprint.page');
    this.dialog.open(ImprintPage);
  }
  /** Loads and opens the data privacy dialog on demand. */
  async openDataPrivacy(): Promise<void> {
    const { DataPrivacyPage } = await import('./pages/public/data-privacy/data-privacy.page');
    this.dialog.open(DataPrivacyPage);
  }
}
