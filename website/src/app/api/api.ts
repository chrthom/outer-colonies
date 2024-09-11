import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { GenericResponse } from '../../../../server/src/shared/interfaces/rest_api';

export default class OCApi {
  protected readonly apiHost = environment.url.api;
  private checkStatus<T>(res: HttpResponse<T | GenericResponse>) {
    if (res.status >= 300) throwError(() => <GenericResponse>res.body);
    return <T>res.body!;
  }
  constructor(protected http: HttpClient) {}
  protected post<T>(path: string, sessionToken?: string, body?: any): Observable<T> {
    return this.http
      .post<T | GenericResponse>(`${this.apiHost}/api/${path}`, body, {
        observe: 'response',
        headers: {
          'Content-Type': 'application/json',
          'session-token': sessionToken ?? ''
        }
      })
      .pipe(map(this.checkStatus));
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
      .pipe(map(this.checkStatus));
  }
  protected get<T>(path: string, sessionToken?: string): Observable<T> {
    return this.http
      .get<T | GenericResponse>(`${this.apiHost}/api/${path}`, {
        observe: 'response',
        headers: {
          'session-token': sessionToken ?? ''
        }
      })
      .pipe(map(this.checkStatus));
  }
  protected delete<T>(path: string, sessionToken?: string): Observable<T> {
    return this.http
      .delete<T | GenericResponse>(`${this.apiHost}/api/${path}`, {
        observe: 'response',
        headers: {
          'session-token': sessionToken ?? ''
        }
      })
      .pipe(map(this.checkStatus));
  }
}
