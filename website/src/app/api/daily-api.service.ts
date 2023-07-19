import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import OCApiWithAuth from './api-with-auth';
import AuthService from '../auth.service';
import { Observable, map } from 'rxjs';
import { DailyGetResponse } from '../../../../server/src/components/shared_interfaces/rest_api';

@Injectable({
  providedIn: 'root'
})
export class DailyApiService extends OCApiWithAuth {
  constructor(authService: AuthService, http: HttpClient) {
    super(authService, http);
  }
  get dailies(): Observable<DailyGetResponse | null> {
    return this.get<DailyGetResponse>('daily', this.token).pipe(map((res) => res.body));
  }
}
