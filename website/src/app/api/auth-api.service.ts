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
  checkSessionToken(sessionToken: string): Observable<AuthLoginResponse | undefined> {
    return this.get<AuthLoginResponse>('auth/login', sessionToken);
  }
  register(body: AuthRegisterRequest): Observable<boolean> {
    return this.post('auth/register', undefined, body).pipe(map(r => r != undefined));
  }
  login(body: AuthLoginRequest): Observable<AuthLoginResponse | undefined> {
    return this.post<AuthLoginResponse>('auth/login', undefined, body);
  }
  logout(sessionToken: string): Observable<void> {
    return this.delete<void>('auth/login', sessionToken);
  }
  forgotPassword(user: string): Observable<string> {
    return this.delete<string>(`auth/password/${user}`);
  }
  resetPassword(resetId: string, password: string): Observable<void> {
    return this.post<void>(`auth/password/${resetId}`, undefined, { password: password });
  }
}
