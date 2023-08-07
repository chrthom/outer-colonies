import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import AuthService from '../auth.service';
import { Observable, map } from 'rxjs';
import { DailyGetResponse } from '../../../../server/src/components/shared_interfaces/rest_api';
import OCApi from './api';

@Injectable({
  providedIn: 'root'
})
export class DailyApiService extends OCApi {
  constructor(
    private authService: AuthService,
    http: HttpClient
  ) {
    super(http);
  }
  get dailies(): Observable<DailyGetResponse | null> {
    return this.get<DailyGetResponse>('daily', this.authService.token);
  }
}
