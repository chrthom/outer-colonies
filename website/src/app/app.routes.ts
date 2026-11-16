import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, Routes } from '@angular/router';
import { map } from 'rxjs';
import { LoginPage } from './pages/login/login.page';
import { HomePage } from './pages/home/home.page';
import { RegisterPage } from './pages/register/register.page';
import { DeckPage } from './pages/deck/deck.page';
import { ImprintPage } from './pages/imprint/imprint.page';
import { DataPrivacyPage } from './pages/data-privacy/data-privacy.page';
import AuthService from './auth.service';
import { environment } from 'src/environments/environment';
import { TradePage } from './pages/trade/trade.page';
import { RulesPage } from './pages/rules/rules.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { ResetPasswordPage } from './pages/reset-password/reset-password.page';
import { ActivateAccountPage } from './pages/activate-account/activate-account.page';
import { ProfilePage } from './pages/profile/profile.page';
import { ConfirmEmailPage } from './pages/confirm-email/confirm-email.page';

/**
 * Redirects to HTTPS when the environment requires it.
 * Returns false if a protocol redirect was triggered (the current navigation is abandoned).
 */
function checkHttps(): boolean {
  if (!environment.https || window.location.protocol == 'https:') {
    return true;
  } else {
    window.location.protocol = 'https:';
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

export const routes: Routes = [
  {
    path: 'activate-account/:id',
    canActivate: [publicGuardFn],
    component: ActivateAccountPage
  },
  {
    path: 'confirm-email/:id',
    canActivate: [publicGuardFn],
    component: ConfirmEmailPage
  },
  {
    path: 'deck',
    canActivate: [privateGuardFn],
    component: DeckPage
  },
  {
    path: 'forgot-password',
    canActivate: [publicGuardFn],
    component: ForgotPasswordPage
  },
  {
    path: 'imprint',
    canActivate: [publicGuardFn],
    component: ImprintPage
  },
  {
    path: 'login',
    canActivate: [publicGuardFn],
    component: LoginPage
  },
  {
    path: 'privacy',
    canActivate: [publicGuardFn],
    component: DataPrivacyPage
  },
  {
    path: 'profile',
    canActivate: [privateGuardFn],
    component: ProfilePage
  },
  {
    path: 'register',
    canActivate: [publicGuardFn],
    component: RegisterPage
  },
  {
    path: 'reset-password/:id',
    canActivate: [publicGuardFn],
    component: ResetPasswordPage
  },
  {
    path: 'rules',
    canActivate: [privateGuardFn],
    component: RulesPage
  },
  {
    path: 'trade',
    canActivate: [privateGuardFn],
    component: TradePage
  },
  {
    path: '',
    canActivate: [privateGuardFn],
    component: HomePage,
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
