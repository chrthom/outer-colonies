import { Component, InjectionToken, Type, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import AuthService from './auth.service';
import { version, releaseName } from '@shared/config/version';

type LegalPage = 'imprint' | 'privacy';

/** Lazy component loaders for the footer's legal dialogs. */
export const LEGAL_PAGE_LOADERS = new InjectionToken<Record<LegalPage, () => Promise<Type<unknown>>>>(
  'Legal page loaders',
  {
    providedIn: 'root',
    factory: () => ({
      imprint: () => import('./pages/public/imprint/imprint.page').then(m => m.ImprintPage),
      privacy: () => import('./pages/public/data-privacy/data-privacy.page').then(m => m.DataPrivacyPage)
    })
  }
);

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
  private legalPageLoaders = inject(LEGAL_PAGE_LOADERS);

  readonly legalLoadErrors: Record<LegalPage, boolean> = { imprint: false, privacy: false };
  readonly legalLoading: Record<LegalPage, boolean> = { imprint: false, privacy: false };

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
  /** Loads and opens the imprint dialog on demand. */
  async openImprint(): Promise<void> {
    await this.openLegalPage('imprint');
  }
  /** Loads and opens the data privacy dialog on demand. */
  async openDataPrivacy(): Promise<void> {
    await this.openLegalPage('privacy');
  }

  private async openLegalPage(page: LegalPage): Promise<void> {
    if (this.legalLoading[page]) {
      return;
    }
    this.legalLoading[page] = true;
    try {
      const component = await this.legalPageLoaders[page]();
      this.dialog.open(component);
      this.legalLoadErrors[page] = false;
    } catch {
      if (environment.stage !== 'production') {
        console.warn(`Failed to open ${page} dialog, showing a retry message`);
      }
      this.legalLoadErrors[page] = true;
    } finally {
      this.legalLoading[page] = false;
    }
  }
}
