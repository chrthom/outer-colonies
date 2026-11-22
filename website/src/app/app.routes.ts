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
import AuthService from './auth.service';
import { environment } from 'src/environments/environment';
import { LandingPage } from './pages/public/landing/landing.page';

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
    const target = inject(Router).parseUrl('/' + initialPath);
    const queryParams = { ...route.queryParams };
    delete queryParams['p'];
    target.queryParams = { ...target.queryParams, ...queryParams };
    return target;
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
    loadComponent: () =>
      import('./pages/public/activate-account/activate-account.page').then(m => m.ActivateAccountPage),
    title: 'Outer Colonies – Nutzerkonto aktivieren'
  },
  {
    path: 'confirm-email/:id',
    canActivate: [publicGuardFn],
    loadComponent: () =>
      import('./pages/public/confirm-email/confirm-email.page').then(m => m.ConfirmEmailPage),
    title: 'Outer Colonies – E-Mail bestätigen'
  },
  {
    path: 'deck',
    canActivate: [privateGuardFn],
    loadComponent: () => import('./pages/private/deck/deck.page').then(m => m.DeckPage),
    title: 'Outer Colonies – Deck-Manager'
  },
  {
    path: 'editions',
    canActivate: [publicGuardFn],
    loadComponent: () => import('./pages/public/editions/editions.page').then(m => m.EditionsPage),
    title: 'Outer Colonies – Die Editionen'
  },
  {
    path: 'factions',
    canActivate: [publicGuardFn],
    loadComponent: () => import('./pages/public/factions/factions.page').then(m => m.FactionsPage),
    title: 'Outer Colonies – Die Mächte'
  },
  {
    path: 'forgot-password',
    canActivate: [publicGuardFn],
    loadComponent: () =>
      import('./pages/public/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage),
    title: 'Outer Colonies – Passwort vergessen'
  },
  {
    path: 'home',
    canActivate: [privateGuardFn],
    loadComponent: () => import('./pages/private/home/home.page').then(m => m.HomePage),
    title: 'Outer Colonies – Spielsuche & Aktuelles'
  },
  {
    path: 'imprint',
    canActivate: [publicGuardFn],
    loadComponent: () => import('./pages/public/imprint/imprint.page').then(m => m.ImprintPage),
    title: 'Outer Colonies – Impressum'
  },
  {
    path: 'login',
    canActivate: [publicGuardFn],
    loadComponent: () => import('./pages/public/login/login.page').then(m => m.LoginPage),
    title: 'Outer Colonies – Login'
  },
  {
    path: 'privacy',
    canActivate: [publicGuardFn],
    loadComponent: () => import('./pages/public/data-privacy/data-privacy.page').then(m => m.DataPrivacyPage),
    title: 'Outer Colonies – Datenschutzerklärung'
  },
  {
    path: 'profile',
    canActivate: [privateGuardFn],
    loadComponent: () => import('./pages/private/profile/profile.page').then(m => m.ProfilePage),
    title: 'Outer Colonies – Profil'
  },
  {
    path: 'register',
    canActivate: [publicGuardFn],
    loadComponent: () => import('./pages/public/register/register.page').then(m => m.RegisterPage),
    title: 'Outer Colonies – Registrieren'
  },
  {
    path: 'reset-password/:id',
    canActivate: [publicGuardFn],
    loadComponent: () =>
      import('./pages/public/reset-password/reset-password.page').then(m => m.ResetPasswordPage),
    title: 'Outer Colonies – Neues Passwort setzen'
  },
  {
    path: 'rules',
    canActivate: [publicGuardFn],
    loadComponent: () => import('./pages/private/rules/rules.page').then(m => m.RulesPage),
    title: 'Outer Colonies – Spielregeln'
  },
  {
    path: 'trade',
    canActivate: [privateGuardFn],
    loadComponent: () => import('./pages/private/trade/trade.page').then(m => m.TradePage),
    title: 'Outer Colonies – Inventar & Markt'
  },
  {
    path: 'world',
    canActivate: [publicGuardFn],
    loadComponent: () => import('./pages/public/world/world.page').then(m => m.WorldPage),
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
