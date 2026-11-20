import { Component, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ImprintPage } from './pages/public/imprint/imprint.page';
import { DataPrivacyPage } from './pages/public/data-privacy/data-privacy.page';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import AuthService from './auth.service';
import { version, releaseName } from '@shared/config/version';

@Component({
  selector: 'oc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', './background.scss'],
  imports: [NavbarComponent, RouterLink, RouterOutlet]
})
export class AppComponent {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Restore a cookie session on startup so the navbar shows the real login state even on public pages,
    // where no route guard triggers the session check.
    this.authService.check().subscribe();
  }

  /** Moves focus and the viewport to the start of the page content. */
  focusMainContent(mainContent: HTMLElement): void {
    mainContent.scrollIntoView({ block: 'start' });
    mainContent.focus({ preventScroll: true });
  }

  /** Whether the public landing page already provides the full set of lore previews. */
  get isLandingPage(): boolean {
    return !this.authService.isLoggedIn && this.router.url.split(/[?#]/, 1)[0] === '/';
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
