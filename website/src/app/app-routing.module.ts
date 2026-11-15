import { NgModule, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  PreloadAllModules,
  Router,
  RouterModule,
  Routes
} from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { HomePage } from './pages/home/home.page';
import { RegisterPage } from './pages/register/register.page';
import { map, tap } from 'rxjs';
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
import { LandingPage } from './pages/landing/landing.page';
import { WorldPage } from './pages/world/world.page';
import { FactionsPage } from './pages/factions/factions.page';
import { HistoryPage } from './pages/history/history.page';
import { EditionsPage } from './pages/editions/editions.page';

function checkHttps(): boolean {
  if (!environment.https || window.location.protocol == 'https:') {
    return true;
  } else {
    window.location.protocol = 'https:';
    return false;
  }
}
const privateGuardFn: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  if (checkHttps()) {
    const router = inject(Router);
    const initialPath = route.queryParams['p'];
    if (initialPath) {
      router.navigate(['/' + initialPath]);
      return false;
    } else {
      return inject(AuthService)
        .check()
        .pipe(tap(b => (!b ? router.navigate(['/login']) : {})));
    }
  } else {
    return false;
  }
};
const publicGuardFn: CanActivateFn = () => checkHttps();

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

const routes: Routes = [
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
    component: ForgotPasswordPage
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
    component: HomePage
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
    path: 'world',
    canActivate: [publicGuardFn],
    component: WorldPage,
    title: 'Outer Colonies – Die Welt'
  },
  {
    path: '',
    canActivate: [publicGuardFn, authenticatedGuardFn],
    component: LandingPage,
    pathMatch: 'full',
    title: 'Outer Colonies – Das Online-Sammelkartenspiel'
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
