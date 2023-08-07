import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AuthRegisterRequest,
  AuthExistsResponse,
  AuthLoginRequest,
  AuthLoginResponse
} from '../../../../server/src/components/shared_interfaces/rest_api';
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
      map(res => (res.body ? res.body.exists : false))
    );
  }
  checkEmailExists(email: string): Observable<boolean> {
    return this.get<AuthExistsResponse>(`auth/exists?email=${email}`).pipe(
      map(res => (res.body ? res.body.exists : false))
    );
  }
  checkSessionToken(sessionToken: string): Observable<AuthLoginResponse | undefined> {
    return this.get<AuthLoginResponse>('auth/login', sessionToken).pipe(
      map(res => {
        const result = res.status >= 200 && res.status < 300 && res.body != null ? res.body : undefined;
        if (!result)
          console.log(`Login API call with session token failed with HTTP ${res.status}: ${res.statusText}`);
        return result;
      })
    );
  }
  register(body: AuthRegisterRequest): Observable<boolean> {
    return this.post('auth/register', undefined, body).pipe(
      map(res => res.status >= 200 && res.status < 300)
    );
  }
  login(body: AuthLoginRequest): Observable<AuthLoginResponse | undefined> {
    return this.post<AuthLoginResponse>('auth/login', undefined, body).pipe(
      map(res => {
        const result = res.status >= 200 && res.status < 300 && res.body != null ? res.body : undefined;
        if (!result) console.log(`Login API call failed with HTTP ${res.status}: ${res.statusText}`);
        return result;
      })
    );
  }
}
