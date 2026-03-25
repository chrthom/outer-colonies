import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { GenericResponse } from '../../../../server/src/shared/interfaces/rest_api';

export default class OCApi {
  protected readonly apiHost = environment.url.api;

  constructor(protected http: HttpClient) {}

  private checkStatus<T>(res: HttpResponse<T | GenericResponse>): T {
    if (res.status >= 300) {
      throw new Error('HTTP error');
    }
    return res.body as T;
  }

  protected post<T>(path: string, sessionToken?: string, body?: any): Observable<T> {
    return this.http
      .post<T | GenericResponse>(`${this.apiHost}/api/${path}`, body, {
        observe: 'response',
        headers: {
          'Content-Type': 'application/json',
          'session-token': sessionToken ?? ''
        }
      })
      .pipe(map<HttpResponse<T | GenericResponse>, T>(this.checkStatus.bind(this)));
  }

  protected put<T>(path: string, sessionToken?: string, body?: any): Observable<T> {
    return this.http
      .put<T | GenericResponse>(`${this.apiHost}/api/${path}`, body, {
        observe: 'response',
        headers: {
          'Content-Type': 'application/json',
          'session-token': sessionToken ?? ''
        }
      })
      .pipe(map<HttpResponse<T | GenericResponse>, T>(this.checkStatus.bind(this)));
  }

  protected get<T>(path: string, sessionToken?: string): Observable<T> {
    return this.http
      .get<T | GenericResponse>(`${this.apiHost}/api/${path}`, {
        observe: 'response',
        headers: {
          'session-token': sessionToken ?? ''
        }
      })
      .pipe(map<HttpResponse<T | GenericResponse>, T>(this.checkStatus.bind(this)));
  }

  protected delete<T>(path: string, sessionToken?: string): Observable<T> {
    return this.http
      .delete<T | GenericResponse>(`${this.apiHost}/api/${path}`, {
        observe: 'response',
        headers: {
          'session-token': sessionToken ?? ''
        }
      })
      .pipe(map<HttpResponse<T | GenericResponse>, T>(this.checkStatus.bind(this)));
  }
}
