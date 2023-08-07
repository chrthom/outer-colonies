import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import AuthApiService from './api/auth-api.service';
import { Observable, map, mergeAll, mergeMap, of, tap } from 'rxjs';
import { AuthLoginResponse } from '../../../server/src/components/shared_interfaces/rest_api';
import { flatMap } from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export default class AuthService {
  private readonly cookieExpiry = 100;
  private username?: string; // TODO: Make private
  private sessionToken?: string; // TODO: Make private

  constructor(
    private cookieService: CookieService,
    private authAPIService: AuthApiService
  ) {}

  login(username: string, password: string, remember: boolean): Observable<boolean> {
    this.username = username;
    return this.check(username, password).pipe(
      tap(success => {
        if (success && remember) {
          this.cookieService.set('u', username, this.cookieExpiry);
          this.cookieService.set('p', password, this.cookieExpiry);
        }
      })
    );
  }

  logout() {
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
      mergeMap(r => {
        let retry = false;
        if (!r && this.sessionToken) retry = true;
        this.sessionToken = r?.sessionToken;
        this.username = r?.username;
        return retry ? this.check() : of(r != null);
      })
    );
  }

  get isLoggedIn(): boolean {
    return this.username != undefined;
  }

  get displayname(): string {
    return this.username ? this.username : '';
  }

  get token(): string {
    return this.sessionToken ? this.sessionToken : '';
  }
}
