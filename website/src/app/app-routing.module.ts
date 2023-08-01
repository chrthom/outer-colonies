import { NgModule, inject } from '@angular/core';
import { CanActivateFn, PreloadAllModules, Router, RouterModule, Routes } from '@angular/router';
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

function forceHttp(): boolean {
  if (!environment.https || window.location.protocol == 'https:') {
    return true;
  } else {
    window.location.protocol = 'https:';
    return false;
  }
}
const privateGuardFn: CanActivateFn = () => {
  if (forceHttp()) {
    const router = inject(Router);
    return inject(AuthService)
      .check()
      .pipe(tap((b) => (!b ? router.navigate(['/login']) : {})));
  } else {
    return false;
  }
};
const publicGuardFn: CanActivateFn = () => forceHttp();

const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuardFn],
    component: LoginPage,
  },
  {
    path: 'register',
    canActivate: [publicGuardFn],
    component: RegisterPage,
  },
  {
    path: 'deck',
    canActivate: [privateGuardFn],
    component: DeckPage,
  },
  {
    path: 'trade',
    canActivate: [privateGuardFn],
    component: TradePage,
  },
  {
    path: 'rules',
    canActivate: [privateGuardFn],
    component: RulesPage,
  },
  {
    path: 'imprint',
    canActivate: [publicGuardFn],
    component: ImprintPage,
  },
  {
    path: 'privacy',
    canActivate: [publicGuardFn],
    component: DataPrivacyPage,
  },
  {
    path: '',
    canActivate: [privateGuardFn],
    component: HomePage,
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
