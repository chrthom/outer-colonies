import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import AuthApiService from './api/auth-api.service';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AuthLoginResponse } from '../../../server/src/shared/interfaces/rest_api';

@Injectable({
  providedIn: 'root'
})
export default class AuthService {
  private readonly cookieExpiryRemember = 100;
  private readonly cookieExpiryDefault = 1;
  private username?: string;
  private sessionToken?: string;
  constructor(
    private cookieService: CookieService,
    private authAPIService: AuthApiService
  ) {}

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
      this.authAPIService.logout(this.sessionToken).subscribe(() => {
        /* Do nothing */
      });
    }
    this.username = undefined;
    this.sessionToken = undefined;
    this.cookieService.delete('u');
    this.cookieService.delete('p');
  }

  check(username?: string, password?: string): Observable<boolean> {
    let res: Observable<AuthLoginResponse | undefined>;
    if (username && password) {
      res = this.authAPIService.login({
        username: username,
        password: password
      });
    } else if (this.sessionToken) {
      res = this.authAPIService.checkSessionToken(this.sessionToken);
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
        this.sessionToken = r?.sessionToken;
        this.username = r?.username;
        return true;
      }),
      catchError(res => {
        console.log(`API call to ${res.url} failed with HTTP ${res.status}: ${res.statusText}`);
        const retry = this.sessionToken != undefined;
        this.sessionToken = undefined;
        this.username = undefined;
        return retry ? this.check() : of(false);
      })
    );
  }

  get isLoggedIn(): boolean {
    return this.username != undefined;
  }

  get displayname(): string {
    return this.username ?? '';
  }

  get token(): string {
    return this.sessionToken ?? '';
  }
}
