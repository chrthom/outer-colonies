import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import ApiService from './api.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export default class AuthService {
  private readonly cookieExpiry = 100;

  username?: string;
  password?: string;
  error?: string;

  constructor(private cookieService: CookieService, private apiService: ApiService) {}

  login(username: string, password: string, remember: boolean): Observable<boolean> {
    this.username = username;
    this.password = password;
    const loginAttempt = this.check();
    if (remember) {
      loginAttempt.subscribe(success => {
        if (success) {
          this.cookieService.set('u', username, this.cookieExpiry);
          this.cookieService.set('p', password, this.cookieExpiry);
        }
      });
    }
    return loginAttempt;
  }

  logout() {
    this.username = undefined;
    this.password = undefined;
    this.cookieService.delete('u');
    this.cookieService.delete('p');
  }

  check(): Observable<boolean> {
    return !this.checkCache() ? of(false) : this.apiService.login({
      username: this.username ? this.username : '',
      password: this.password ? this.password : ''
    });
  }

  private checkCache(): boolean {
    if (!this.username || !this.password) {
      this.username = this.cookieService.get('u');
      this.password = this.cookieService.get('p');
    }
    return !(!this.username || !this.password);
  }
}
