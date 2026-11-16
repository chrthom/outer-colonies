import { Injectable, inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import AuthApiService from './api/auth-api.service';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AuthLoginResponse } from '@shared/interfaces/rest_api';

@Injectable({
  providedIn: 'root'
})
export default class AuthService {
  private cookieService = inject(CookieService);
  private authAPIService = inject(AuthApiService);

  private readonly cookieExpiryRemember = 100;
  private readonly cookieExpiryDefault = 1;
  private username?: string;
  private sessionToken?: string;

  login(username: string, password: string, remember: boolean): Observable<boolean> {
    this.username = username;
    return this.check(username, password).pipe(
      tap(success => {
        if (success) {
          this.cookieService.set(
            'u',
            username,
            remember ? this.cookieExpiryRemember : this.cookieExpiryDefault
          );
          this.cookieService.set(
            'p',
            password,
            remember ? this.cookieExpiryRemember : this.cookieExpiryDefault
          );
        }
      })
    );
  }

  logout() {
    if (this.sessionToken) {
      this.authAPIService.logout().subscribe({
        next: () => {
          /* Do nothing */
        },
        error: () => {
          /* The session is cleared locally regardless; errors are handled centrally by the API error interceptor */
        }
      });
    }
    this.clearSession();
    this.cookieService.delete('u');
    this.cookieService.delete('p');
  }

  /**
   * Clears the in-memory session state without touching the persisted
   * ("remember me") credentials. Called by the API error interceptor on
   * 401/403 (missing, invalid or expired session).
   */
  clearSession() {
    this.username = undefined;
    this.sessionToken = undefined;
  }

  check(username?: string, password?: string): Observable<boolean> {
    let res: Observable<AuthLoginResponse>;
    if (username && password) {
      res = this.authAPIService.login({
        username: username,
        password: password
      });
    } else if (this.sessionToken) {
      res = this.authAPIService.checkSessionToken();
    } else if (this.cookieService.get('u')) {
      res = this.authAPIService.login({
        username: this.cookieService.get('u'),
        password: this.cookieService.get('p')
      });
    } else {
      return of(false);
    }
    return res.pipe(
      map(r => {
        this.sessionToken = r.sessionToken;
        this.username = r.username;
        return true;
      }),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  get isLoggedIn(): boolean {
    return !!this.sessionToken;
  }

  get displayname(): string {
    return this.username ?? '';
  }

  get token(): string {
    return this.sessionToken ?? '';
  }
}
