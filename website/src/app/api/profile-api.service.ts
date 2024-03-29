import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import AuthService from '../auth.service';
import { Observable } from 'rxjs';
import { ProfileGetResponse } from '../../../../server/src/shared/interfaces/rest_api';
import OCApi from './api';

@Injectable({
  providedIn: 'root'
})
export class ProfileApiService extends OCApi {
  constructor(
    private authService: AuthService,
    http: HttpClient
  ) {
    super(http);
  }
  get profile(): Observable<ProfileGetResponse | null> {
    return this.get<ProfileGetResponse>('profile', this.authService.token);
  }
}
