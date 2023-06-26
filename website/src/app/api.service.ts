import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  startDeck: number;
}

@Injectable({
  providedIn: 'root'
})
export default class ApiService {
  readonly apiHost = 'http://localhost:3000';
  constructor(private http: HttpClient) {}
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
  private get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.apiHost}/api/${path}`);
  }
}
