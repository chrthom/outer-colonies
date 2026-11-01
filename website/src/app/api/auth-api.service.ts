import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AuthRegisterRequest,
  AuthExistsResponse,
  AuthLoginRequest,
  AuthLoginResponse
} from '../../../../server/src/shared/interfaces/rest_api';
import OCApi from './api';

@Injectable({
  providedIn: 'root'
})
export default class AuthApiService extends OCApi {
  constructor() {
    const http = inject(HttpClient);

    super(http);
  }
  checkUsernameExists(username: string): Observable<boolean> {
    return this.get<AuthExistsResponse>(`auth/exists?username=${username}`).pipe(
      map(res => (res ? res.exists : false))
    );
  }
  checkEmailExists(email: string): Observable<boolean> {
    return this.get<AuthExistsResponse>(`auth/exists?email=${email}`).pipe(
      map(res => (res ? res.exists : false))
    );
  }
  checkSessionToken(): Observable<AuthLoginResponse> {
    return this.get<AuthLoginResponse>('auth/login');
  }
  register(body: AuthRegisterRequest): Observable<void> {
    return this.post('auth/register', body);
  }
  activate(activateId: string): Observable<void> {
    return this.put(`auth/register/${activateId}`);
  }
  login(body: AuthLoginRequest): Observable<AuthLoginResponse> {
    return this.post<AuthLoginResponse>('auth/login', body);
  }
  logout(): Observable<void> {
    return this.delete('auth/login');
  }
  forgotPassword(user: string): Observable<void> {
    return this.delete(`auth/password/${user}`);
  }
  resetPassword(password: string): Observable<void> {
    return this.put('auth/password', { password: password });
  }
  resetPasswordViaMagicLink(resetId: string, password: string): Observable<void> {
    return this.put(`auth/password/${resetId}`, { password: password });
  }
  resetEmail(email: string): Observable<void> {
    return this.post('auth/email', { email: email });
  }
  confirmEmail(confirmId: string): Observable<void> {
    return this.put(`auth/email/${confirmId}`);
  }
}
