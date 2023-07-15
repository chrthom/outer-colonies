import { NgModule, inject } from '@angular/core';
import { CanActivateFn, PreloadAllModules, Router, RouterModule, Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { HomePage } from './pages/home/home.page';
import { RegisterPage } from './pages/register/register.page';
import { tap } from 'rxjs';
import { DeckPage } from './pages/deck/deck.component';
import { ImprintComponent as ImprintPage } from './pages/imprint/imprint.page';
import { DataPrivacyComponent as DataPrivacyPage } from './pages/data-privacy/data-privacy.page';
import AuthService from './auth.service';
import { environment } from 'src/environments/environment';

const authGuardFn: CanActivateFn = () => {
  return inject(AuthService).check().pipe(tap(b => !b ? inject(Router).navigate([ '/login' ]) : {}))
};
const httpsGuardFn: CanActivateFn = () => {
  if (!environment.https || window.location.protocol == "https:") return true;
  else {
    window.location.protocol = "https:";
    window.location.reload();
    return false;
  }
};

const routes: Routes = [
  {
    path: '',
    canActivate: [ httpsGuardFn ],
    canActivateChild: [ httpsGuardFn ],
    children: [
      {
        path: 'login',
        component: LoginPage
      }, {
        path: 'register',
        component: RegisterPage
      }, {
        path: 'deck',
        canActivate: [ authGuardFn ],
        component: DeckPage
      }, {
        path: 'imprint',
        component: ImprintPage
      }, {
        path: 'privacy',
        component: DataPrivacyPage
      }, {
        path: '',
        canActivate: [ authGuardFn ],
        component: HomePage,
        pathMatch: 'full'
      }, {
        path: '**',
        redirectTo: ''
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
