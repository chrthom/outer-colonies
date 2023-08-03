import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import AuthService from '../auth.service';
import { Observable, map } from 'rxjs';
import { ProfileGetResponse } from '../../../../server/src/components/shared_interfaces/rest_api';
import OCApiWithAuth from './api-with-auth';

@Injectable({
  providedIn: 'root'
})
export class ProfileApiService extends OCApiWithAuth {
  constructor(authService: AuthService, http: HttpClient) {
    super(authService, http);
  }
  get profile(): Observable<ProfileGetResponse | null> {
    return this.get<ProfileGetResponse>('profile', this.token).pipe(map(res => res.body));
  }
}
