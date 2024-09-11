import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import AuthService from '../auth.service';
import { Observable } from 'rxjs';
import { DailyGetResponse } from '../../../../server/src/shared/interfaces/rest_api';
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
  get dailies(): Observable<DailyGetResponse> {
    return this.get<DailyGetResponse>('daily', this.authService.token);
  }
}
