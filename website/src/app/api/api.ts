import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { GenericResponse } from '@shared/interfaces/rest_api';

export default class OCApi {
  protected readonly apiHost = environment.url.api;

  constructor(protected http: HttpClient) {}

  private checkStatus<T>(res: HttpResponse<T | GenericResponse>): T {
    if (res.status >= 300) {
      throw new Error('HTTP error');
    }
    return res.body as T;
  }

  protected post<T>(path: string, body?: any): Observable<T> {
    return this.http
      .post<T | GenericResponse>(`${this.apiHost}/api/${path}`, body, {
        observe: 'response',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .pipe(map<HttpResponse<T | GenericResponse>, T>(this.checkStatus.bind(this)));
  }

  protected put<T>(path: string, body?: any): Observable<T> {
    return this.http
      .put<T | GenericResponse>(`${this.apiHost}/api/${path}`, body, {
        observe: 'response',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .pipe(map<HttpResponse<T | GenericResponse>, T>(this.checkStatus.bind(this)));
  }

  /**
   * Sends a GET request to the given API path. Query parameters are passed as a record and
   * URL-encoded via `HttpParams`, so raw user input is never interpolated unencoded into the
   * request URL (e.g. `&`, `+` or `%` in email addresses).
   */
  protected get<T>(path: string, params: Record<string, string> = {}): Observable<T> {
    return this.http
      .get<T | GenericResponse>(`${this.apiHost}/api/${path}`, {
        observe: 'response',
        params: new HttpParams({ fromObject: params })
      })
      .pipe(map<HttpResponse<T | GenericResponse>, T>(this.checkStatus.bind(this)));
  }

  protected delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T | GenericResponse>(`${this.apiHost}/api/${path}`, {
        observe: 'response'
      })
      .pipe(map<HttpResponse<T | GenericResponse>, T>(this.checkStatus.bind(this)));
  }
}
