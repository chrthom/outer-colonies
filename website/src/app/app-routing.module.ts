import { NgModule, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, PreloadAllModules, RouterModule, RouterStateSnapshot, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { LoginPage } from './pages/login/login.page';
import { HomePage } from './pages/home/home.page';
import { RegisterPage } from './pages/register/register.page';
import { Observable } from 'rxjs';
import { DeckPage } from './pages/deck/deck.component';
import { ImprintComponent as ImprintPage } from './pages/imprint/imprint.page';

const canActivateFn: CanActivateFn =
  (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => inject(AuthGuard).canActivate(next, state);
const routes: Routes = [
  {
    path: 'login',
    component: LoginPage
  }, {
    path: 'register',
    component: RegisterPage
  }, {
    path: 'deck',
    canActivate: [canActivateFn],
    component: DeckPage
  }, {
    path: 'imprint',
    component: ImprintPage
  }, {
    path: '',
    canActivate: [canActivateFn],
    component: HomePage,
    pathMatch: 'full'
  }, {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
