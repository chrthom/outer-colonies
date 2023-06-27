import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RegisterRequest, ExistsResponse } from '../../../server/src/components/utils/api';

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
    return this.post('auth/register', body).pipe(map(res => {
      const success = res.status >= 200 && res.status < 300;
      if (!success) console.log(`Register API call returned with HTTP ${res.status}: ${res.statusText}`);
      return success;
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
