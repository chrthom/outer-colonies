import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RegisterRequest, ExistsResponse, LoginRequest, RegisterResponse, LoginResponse } from '../../../server/src/components/utils/api';

@Injectable({
  providedIn: 'root'
})
export default class ApiService {
  readonly apiHost = 'http://localhost:3000';
  constructor(private http: HttpClient) {}
  checkUsernameExists(username: string): Observable<boolean> {
    return this.get<ExistsResponse>(`auth/exists?username=${username}`)
      .pipe(map(res => res.body ? res.body.exists : false));
  }
  checkEmailExists(email: string): Observable<boolean> {
    return this.get<ExistsResponse>(`auth/exists?email=${email}`)
      .pipe(map(res => res.body ? res.body.exists : false));
  }
  register(body: RegisterRequest): Observable<boolean> {
    return this.post<RegisterResponse>('auth/register', body).pipe(map(res => {
      const success = res.status >= 200 && res.status < 300 && res.body != null && res.body.success;
      if (!success) console.log(`Register API call failed with HTTP ${res.status}: ${res.statusText}`);
      return success;
    }));
  }
  login(body: LoginRequest): Observable<string | undefined> {
    return this.post<LoginResponse>('auth/login', body).pipe(map(res => {
      const sessionToken = res.status >= 200 && res.status < 300 && res.body != null ? res.body.sessionToken : undefined;
      if (!sessionToken) console.log(`Login API call failed with HTTP ${res.status}: ${res.statusText}`);
      return sessionToken;
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
  private get<T>(path: string): Observable<HttpResponse<T>> {
    return this.http.get<T>(`${this.apiHost}/api/${path}`, { observe: 'response' });
  }
}
