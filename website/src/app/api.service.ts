import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthRegisterRequest, AuthExistsResponse, AuthLoginRequest, AuthRegisterResponse, AuthLoginResponse, DeckListResponse } from '../../../server/src/components/shared_interfaces/rest_api';
import AuthService from './auth.service';

@Injectable({
  providedIn: 'root'
})
export default class ApiService {
  readonly apiHost = 'http://localhost:3000';
  constructor(private http: HttpClient) {}
  checkUsernameExists(username: string): Observable<boolean> {
    return this.get<AuthExistsResponse>(`auth/exists?username=${username}`)
      .pipe(map(res => res.body ? res.body.exists : false));
  }
  checkEmailExists(email: string): Observable<boolean> {
    return this.get<AuthExistsResponse>(`auth/exists?email=${email}`)
      .pipe(map(res => res.body ? res.body.exists : false));
  }
  register(body: AuthRegisterRequest): Observable<boolean> {
    return this.post<AuthRegisterResponse>('auth/register', body).pipe(map(res => {
      const success = res.status >= 200 && res.status < 300 && res.body != null && res.body.success;
      if (!success) console.log(`Register API call failed with HTTP ${res.status}: ${res.statusText}`);
      return success;
    }));
  }
  login(body: AuthLoginRequest): Observable<string | undefined> {
    return this.post<AuthLoginResponse>('auth/login', body).pipe(map(res => {
      const sessionToken = res.status >= 200 && res.status < 300 && res.body != null ? res.body.sessionToken : undefined;
      if (!sessionToken) console.log(`Login API call failed with HTTP ${res.status}: ${res.statusText}`);
      return sessionToken;
    }));
  }
  listDeck(sessionToken?: string, doNotRetry?: boolean): Observable<DeckListResponse | undefined> {
    return this.get<DeckListResponse>('deck', sessionToken).pipe(map(res => {
      const result = res.status >= 200 && res.status < 300 && res.body != null ? res.body : undefined;
      return result;
    }));
  }
  private post<T>(path: string, body?: any): Observable<HttpResponse<T>> {
    return this.http.post<T>(`${this.apiHost}/api/${path}`, body, {
      headers: {
        'Content-Type': 'application/json'
      },
      observe: 'response'
    });
  }
  private get<T>(path: string, sessionToken?: string): Observable<HttpResponse<T>> {
    return this.http.get<T>(`${this.apiHost}/api/${path}`, { 
      observe: 'response',
      headers: {
        'session-token': sessionToken ? sessionToken : ''
      }
    });
  }
}
