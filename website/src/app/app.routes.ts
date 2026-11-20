import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  PreloadAllModules,
  Router,
  Routes,
  provideRouter,
  withInMemoryScrolling,
  withPreloading
} from '@angular/router';
import { map } from 'rxjs';
import { LoginPage } from './pages/public/login/login.page';
import { HomePage } from './pages/private/home/home.page';
import { RegisterPage } from './pages/public/register/register.page';
import { DeckPage } from './pages/private/deck/deck.page';
import { ImprintPage } from './pages/public/imprint/imprint.page';
import { DataPrivacyPage } from './pages/public/data-privacy/data-privacy.page';
import AuthService from './auth.service';
import { environment } from 'src/environments/environment';
import { TradePage } from './pages/private/trade/trade.page';
import { RulesPage } from './pages/private/rules/rules.page';
import { ForgotPasswordPage } from './pages/public/forgot-password/forgot-password.page';
import { ResetPasswordPage } from './pages/public/reset-password/reset-password.page';
import { ActivateAccountPage } from './pages/public/activate-account/activate-account.page';
import { ProfilePage } from './pages/private/profile/profile.page';
import { ConfirmEmailPage } from './pages/public/confirm-email/confirm-email.page';
import { LandingPage } from './pages/public/landing/landing.page';
import { WorldPage } from './pages/public/world/world.page';
import { FactionsPage } from './pages/public/factions/factions.page';
import { HistoryPage } from './pages/public/history/history.page';
import { EditionsPage } from './pages/public/editions/editions.page';

/**
 * Redirects to HTTPS when the environment requires it.
 * Returns false if a protocol redirect was triggered (the current navigation is abandoned).
 */
function checkHttps(): boolean {
  if (!environment.https || window.location.protocol == 'https:') {
    return true;
  } else {
    window.location.replace(
      `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`
    );
    return false;
  }
}

/**
 * Guard for private pages: forces HTTPS, resolves the `?p=` deep link and
 * redirects unauthenticated users to the login page.
 */
const privateGuardFn: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  if (checkHttps()) {
    const router = inject(Router);
    const initialPath = route.queryParams['p'];
    if (initialPath) {
      return router.parseUrl('/' + initialPath);
    } else {
      return inject(AuthService)
        .check()
        .pipe(map(b => (b ? true : router.parseUrl('/login'))));
    }
  } else {
    return false;
  }
};

/** Guard for public pages: only forces HTTPS. */
const publicGuardFn: CanActivateFn = () => checkHttps();

/**
 * Resolves deep links of the form /?p=<path> (the only deep-link form that works behind the
 * production hosting, see #253) by redirecting to the target route, so the target route's own
 * guards apply - anonymous deep links to private routes still cascade to /login.
 */
const deepLinkGuardFn: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const initialPath = route.queryParams['p'];
  if (initialPath) {
    return inject(Router).parseUrl('/' + initialPath);
  }
  return true;
};

/**
 * Redirects already authenticated visitors from the public landing page to the game home page,
 * so logged-in players always end up in the game instead of on the marketing page.
 */
const authenticatedGuardFn: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService)
    .check()
    .pipe(
      map(authenticated => {
        if (authenticated) {
          router.navigate(['/home']);
          return false;
        }
        return true;
      })
    );
};

export const routes: Routes = [
  {
    path: 'activate-account/:id',
    canActivate: [publicGuardFn],
    component: ActivateAccountPage,
    title: 'Outer Colonies – Nutzerkonto aktivieren'
  },
  {
    path: 'confirm-email/:id',
    canActivate: [publicGuardFn],
    component: ConfirmEmailPage,
    title: 'Outer Colonies – E-Mail bestätigen'
  },
  {
    path: 'deck',
    canActivate: [privateGuardFn],
    component: DeckPage,
    title: 'Outer Colonies – Deck-Manager'
  },
  {
    path: 'editions',
    canActivate: [publicGuardFn],
    component: EditionsPage,
    title: 'Outer Colonies – Die Editionen'
  },
  {
    path: 'factions',
    canActivate: [publicGuardFn],
    component: FactionsPage,
    title: 'Outer Colonies – Die Mächte'
  },
  {
    path: 'forgot-password',
    canActivate: [publicGuardFn],
    component: ForgotPasswordPage,
    title: 'Outer Colonies – Passwort vergessen'
  },
  {
    path: 'history',
    canActivate: [publicGuardFn],
    component: HistoryPage,
    title: 'Outer Colonies – Die Geschichte'
  },
  {
    path: 'home',
    canActivate: [privateGuardFn],
    component: HomePage,
    title: 'Outer Colonies – Spielsuche & Aktuelles'
  },
  {
    path: 'imprint',
    canActivate: [publicGuardFn],
    component: ImprintPage,
    title: 'Outer Colonies – Impressum'
  },
  {
    path: 'login',
    canActivate: [publicGuardFn],
    component: LoginPage,
    title: 'Outer Colonies – Login'
  },
  {
    path: 'privacy',
    canActivate: [publicGuardFn],
    component: DataPrivacyPage,
    title: 'Outer Colonies – Datenschutzerklärung'
  },
  {
    path: 'profile',
    canActivate: [privateGuardFn],
    component: ProfilePage,
    title: 'Outer Colonies – Profil'
  },
  {
    path: 'register',
    canActivate: [publicGuardFn],
    component: RegisterPage,
    title: 'Outer Colonies – Registrieren'
  },
  {
    path: 'reset-password/:id',
    canActivate: [publicGuardFn],
    component: ResetPasswordPage,
    title: 'Outer Colonies – Neues Passwort setzen'
  },
  {
    path: 'rules',
    canActivate: [privateGuardFn],
    component: RulesPage,
    title: 'Outer Colonies – Spielregeln'
  },
  {
    path: 'trade',
    canActivate: [privateGuardFn],
    component: TradePage,
    title: 'Outer Colonies – Inventar & Markt'
  },
  {
    path: 'world',
    canActivate: [publicGuardFn],
    component: WorldPage,
    title: 'Outer Colonies – Die Welt'
  },
  {
    path: '',
    canActivate: [publicGuardFn, deepLinkGuardFn, authenticatedGuardFn],
    component: LandingPage,
    pathMatch: 'full',
    title: 'Outer Colonies – Das Online-Sammelkartenspiel'
  },
  {
    path: '**',
    redirectTo: ''
  }
];

export const appRouterProviders = provideRouter(
  routes,
  withPreloading(PreloadAllModules),
  withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
);
