import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import AuthService from '../auth.service';
import { Observable } from 'rxjs';
import { ProfileGetResponse } from '../../../../server/src/shared/interfaces/rest_api';
import OCApi from './api';

@Injectable({
  providedIn: 'root'
})
export class ProfileApiService extends OCApi {
  private authService = inject(AuthService);

  constructor() {
    const http = inject(HttpClient);

    super(http);
  }
  get profile(): Observable<ProfileGetResponse> {
    return this.get<ProfileGetResponse>('profile', this.authService.token);
  }
  setNewsletter(subscribed: boolean): Observable<void> {
    return subscribed
      ? this.put('profile/newsletter', this.authService.token)
      : this.delete('profile/newsletter', this.authService.token);
  }
}
