import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
  constructor(http: HttpClient) {
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
  checkSessionToken(sessionToken: string): Observable<AuthLoginResponse> {
    return this.get<AuthLoginResponse>('auth/login', sessionToken);
  }
  register(body: AuthRegisterRequest): Observable<void> {
    return this.post('auth/register', undefined, body);
  }
  activate(activateId: string): Observable<void> {
    return this.put(`auth/register/${activateId}`);
  }
  login(body: AuthLoginRequest): Observable<AuthLoginResponse> {
    return this.post<AuthLoginResponse>('auth/login', undefined, body);
  }
  logout(sessionToken: string): Observable<void> {
    return this.delete('auth/login', sessionToken);
  }
  forgotPassword(user: string): Observable<void> {
    return this.delete(`auth/password/${user}`);
  }
  resetPassword(sessionToken: string, password: string): Observable<void> {
    return this.put('auth/password', sessionToken, { password: password });
  }
  resetPasswordViaMagicLink(resetId: string, password: string): Observable<void> {
    return this.put(`auth/password/${resetId}`, undefined, { password: password });
  }
  resetEmail(sessionToken: string, email: string): Observable<void> {
    return this.put('auth/email', sessionToken, { email: email });
  }
  confirmEmail(confirmId: string): Observable<void> {
    return this.put(`auth/email/${confirmId}`);
  }
}
