import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OnlineGetResponse } from '@shared/interfaces/rest_api';
import OCApi from './api';

@Injectable({
  providedIn: 'root'
})
export class OnlineApiService extends OCApi {
  constructor() {
    const http = inject(HttpClient);

    super(http);
  }

  /** Number of unique logged-in users currently online. Unauthenticated endpoint. */
  get online(): Observable<OnlineGetResponse> {
    return this.get<OnlineGetResponse>('online');
  }
}
