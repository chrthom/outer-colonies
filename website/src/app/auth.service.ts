import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export default class AuthService {
  private readonly cookieExpiry = 100;

  username?: string;
  password?: string;
  error?: string;

  constructor(private cookieService: CookieService, private http: HttpClient) { }

  private checkCache(): boolean {
    if (!this.username || !this.password) {
      this.username = this.cookieService.get('u');
      this.password = this.cookieService.get('p');
    }
    return !(!this.username || !this.password);
  }

  login(username: string, password: string, remember: boolean): boolean {
    this.username = username;
    this.password = password;
    const success = this.check();
    if (success && remember) {
      this.cookieService.set('u', username, this.cookieExpiry);
      this.cookieService.set('p', password, this.cookieExpiry);
    }
    return success;
  }

  logout() {
    this.username = undefined;
    this.password = undefined;
    this.cookieService.delete('u');
    this.cookieService.delete('p');
  }

  check(): boolean {
    if (!this.checkCache()) {
      return false;
    } else {
      // TODO
      return false;
      /*
      return this.callLDAPAuthService(this.username, this.password).pipe(
        map(resp => {
          if (resp.success) {
            this.usernr = resp.usernr;
            this.displayname = resp.displayname;
            this.group = resp.group;
            this.error = undefined;
            return true;
          } else {
            this.error = resp.error;
            return of(false);
          }
        }),
        flatMap(success => {
          if (success) {
            return this.callSynologyAuthService(this.username, this.password).pipe(
              map(token => {
                this.synologyHeaders.headers['X-SYNO-TOKEN'] = token;
                return true;
              }),
              catchError(x => {
                this.error = 'Synology login failed';
                return of(false);
              })
            );
          } else {
            return of(false);
          }
        }),
        catchError(x => {
          this.error = 'internal server error';
          return of(false);
        })
      );
      */
    }
  }
}
