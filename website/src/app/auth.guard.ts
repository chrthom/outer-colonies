import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import AuthService from './auth.service';
import { Observable, filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router, private authService: AuthService) { }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
	): Observable<boolean> {
		const success = this.authService.check();
    success.pipe(filter(b => !b)).subscribe(_ => this.router.navigate([ '/login' ]));
    return success;
  }
}
