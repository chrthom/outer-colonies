import { Injectable, inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import AuthApiService from './api/auth-api.service';
import { Observable, catchError, finalize, map, of, share, tap } from 'rxjs';
import { AuthLoginResponse } from '../../../server/src/shared/interfaces/rest_api';

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
  private pendingCheck?: Observable<boolean>;

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
        error: err => console.error('Logout API call failed', err)
      });
    }
    this.username = undefined;
    this.sessionToken = undefined;
    this.cookieService.delete('u');
    this.cookieService.delete('p');
  }

  /**
   * Checks the current session and stores the received credentials on success.
   * With username and password via login, otherwise via session token or stored cookie credentials.
   * Concurrent argument-less checks are deduplicated: while one check is in flight, further callers
   * share the same request instead of racing multiple logins (every login invalidates previously
   * issued session tokens, so concurrent logins can leave the client with a stale token).
   */
  check(username?: string, password?: string): Observable<boolean> {
    if (username && password) {
      return this.executeCheck(username, password);
    }
    return (this.pendingCheck ??= this.executeCheck().pipe(
      finalize(() => (this.pendingCheck = undefined)),
      share()
    ));
  }

  /**
   * Sends the actual session check request.
   * @param username Optional username for a direct login
   * @param password Optional password for a direct login
   */
  private executeCheck(username?: string, password?: string): Observable<boolean> {
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
      catchError(res => {
        console.log(`API call to ${res.url} failed with HTTP ${res.status}: ${res.statusText}`);
        const retry = this.sessionToken != undefined;
        this.sessionToken = undefined;
        this.username = undefined;
        return retry ? this.executeCheck() : of(false);
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
