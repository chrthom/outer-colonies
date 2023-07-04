import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import AuthService from './auth.service';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router, private authService: AuthService) { }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
	): Observable<boolean> {
    return this.authService.check().pipe(tap(b => !b ? this.router.navigate([ '/login' ]) : {}));
  }
}
