import { NgModule, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, PreloadAllModules, RouterModule, RouterStateSnapshot, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';

const canActivateFn: CanActivateFn =
  (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => inject(AuthGuard).canActivate(next, state);
const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  }, {
    path: '',
    canActivate: [canActivateFn],
    component: HomeComponent,
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
