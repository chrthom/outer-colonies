import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import AuthApiService from './api/auth-api.service';
import { Observable, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export default class AuthService {
  private readonly cookieExpiry = 100;

  username?: string;
  password?: string;
  sessionToken?: string;
  error?: string;

  constructor(
    private cookieService: CookieService,
    private authAPIService: AuthApiService,
  ) {}

  login(username: string, password: string, remember: boolean): Observable<boolean> {
    this.username = username;
    this.password = password;
    return this.check().pipe(tap((success) => {
      if (success && remember) {
        this.cookieService.set('u', username, this.cookieExpiry);
        this.cookieService.set('p', password, this.cookieExpiry);
      }
    }));
  }

  logout() {
    this.username = undefined;
    this.password = undefined;
    this.sessionToken = undefined;
    this.cookieService.delete('u');
    this.cookieService.delete('p');
  }

  check(): Observable<boolean> {
    return !this.checkCache()
      ? of(false)
      : this.authAPIService
          .login({
            username: this.username ? this.username : '',
            password: this.password ? this.password : '',
          })
          .pipe(
            tap((sessionToken) => (this.sessionToken = sessionToken)),
            map((sessionToken) => sessionToken != undefined),
          );
  }

  private checkCache(): boolean {
    // TODO: Double-check what this does
    if (!this.username || !this.password) {
      this.username = this.cookieService.get('u');
      this.password = this.cookieService.get('p');
    }
    return !(!this.username || !this.password);
  }
}
