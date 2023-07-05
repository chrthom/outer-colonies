import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

export default class OCApi {
  protected readonly apiHost = environment.url.api;
  constructor(protected http: HttpClient) {}
  protected post<T>(path: string, sessionToken?: string, body?: any): Observable<HttpResponse<T>> {
    return this.http.post<T>(`${this.apiHost}/api/${path}`, body, {
      headers: {
        'Content-Type': 'application/json',
        'session-token': sessionToken ? sessionToken : ''
      },
      observe: 'response'
    });
  }
  protected get<T>(path: string, sessionToken?: string): Observable<HttpResponse<T>> {
  return this.http.get<T>(`${this.apiHost}/api/${path}`, { 
    observe: 'response',
    headers: {
      'session-token': sessionToken ? sessionToken : ''
    }
  });
  }
  protected delete<T>(path: string, sessionToken?: string): Observable<HttpResponse<T>> {
  return this.http.delete<T>(`${this.apiHost}/api/${path}`, { 
      observe: 'response',
      headers: {
        'session-token': sessionToken ? sessionToken : ''
      }
    });
  }
}