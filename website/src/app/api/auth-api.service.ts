import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthRegisterRequest, AuthExistsResponse, AuthLoginRequest, AuthRegisterResponse, AuthLoginResponse, DeckListResponse } from '../../../../server/src/components/shared_interfaces/rest_api';
import OCApi from './api';

@Injectable({
  providedIn: 'root'
})
export default class AuthApiService extends OCApi {
  constructor(http: HttpClient) {
    super(http);
  }
  checkUsernameExists(username: string): Observable<boolean> {
    return this.get<AuthExistsResponse>(`auth/exists?username=${username}`)
      .pipe(map(res => res.body ? res.body.exists : false));
  }
  checkEmailExists(email: string): Observable<boolean> {
    return this.get<AuthExistsResponse>(`auth/exists?email=${email}`)
      .pipe(map(res => res.body ? res.body.exists : false));
  }
  register(body: AuthRegisterRequest): Observable<boolean> {
    return this.post<AuthRegisterResponse>('auth/register', undefined, body).pipe(map(res => {
      const success = res.status >= 200 && res.status < 300 && res.body != null && res.body.success;
      if (!success) console.log(`Register API call failed with HTTP ${res.status}: ${res.statusText}`);
      return success;
    }));
  }
  login(body: AuthLoginRequest): Observable<string | undefined> {
    return this.post<AuthLoginResponse>('auth/login', undefined, body).pipe(map(res => {
      const sessionToken = res.status >= 200 && res.status < 300 && res.body != null ? res.body.sessionToken : undefined;
      if (!sessionToken) console.log(`Login API call failed with HTTP ${res.status}: ${res.statusText}`);
      return sessionToken;
    }));
  }
}
