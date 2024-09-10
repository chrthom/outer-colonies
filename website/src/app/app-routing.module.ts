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
import { tap } from 'rxjs';
import { DeckPage } from './pages/deck/deck.page';
import { ImprintPage } from './pages/imprint/imprint.page';
import { DataPrivacyPage } from './pages/data-privacy/data-privacy.page';
import AuthService from './auth.service';
import { environment } from 'src/environments/environment';
import { TradePage } from './pages/trade/trade.page';
import { RulesPage } from './pages/rules/rules.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';

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

const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuardFn],
    component: LoginPage
  },
  {
    path: 'register',
    canActivate: [publicGuardFn],
    component: RegisterPage
  },
  {
    path: 'forgot-password',
    canActivate: [publicGuardFn],
    component: ForgotPasswordPage
  },
  {
    path: 'deck',
    canActivate: [privateGuardFn],
    component: DeckPage
  },
  {
    path: 'trade',
    canActivate: [privateGuardFn],
    component: TradePage
  },
  {
    path: 'rules',
    canActivate: [privateGuardFn],
    component: RulesPage
  },
  {
    path: 'imprint',
    canActivate: [publicGuardFn],
    component: ImprintPage
  },
  {
    path: 'privacy',
    canActivate: [publicGuardFn],
    component: DataPrivacyPage
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

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
