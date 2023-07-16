import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import OCApi from './api';
import AuthService from '../auth.service';
import { Observable, map } from 'rxjs';
import { DailyGetResponse } from '../../../../server/src/components/shared_interfaces/rest_api';

@Injectable({
  providedIn: 'root'
})
export class DailyApiService extends OCApi {
  constructor(private authService: AuthService, http: HttpClient) {
    super(http);
  }
  get dailies(): Observable<DailyGetResponse | null> {
    return this.get<DailyGetResponse>('daily', this.token).pipe(map((res) => res.body));
  }
  private get token(): string {
    return this.authService.sessionToken ? this.authService.sessionToken : '';
  }
}
