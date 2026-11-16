import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export default class OCApi {
  protected readonly apiHost = environment.url.api;

  constructor(protected http: HttpClient) {}

  protected post<T>(path: string, body?: any): Observable<T> {
    return this.http.post<T>(`${this.apiHost}/api/${path}`, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  protected put<T>(path: string, body?: any): Observable<T> {
    return this.http.put<T>(`${this.apiHost}/api/${path}`, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Sends a GET request to the given API path. Query parameters are passed as a record and
   * URL-encoded via `HttpParams`, so raw user input is never interpolated unencoded into the
   * request URL (e.g. `&`, `+` or `%` in email addresses).
   */
  protected get<T>(path: string, params: Record<string, string> = {}): Observable<T> {
    return this.http.get<T>(`${this.apiHost}/api/${path}`, {
      params: new HttpParams({ fromObject: params })
    });
  }

  protected delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiHost}/api/${path}`);
  }
}
