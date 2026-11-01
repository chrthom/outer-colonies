import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileGetResponse } from '../../../../server/src/shared/interfaces/rest_api';
import OCApi from './api';

@Injectable({
  providedIn: 'root'
})
export class ProfileApiService extends OCApi {
  constructor() {
    const http = inject(HttpClient);

    super(http);
  }
  get profile(): Observable<ProfileGetResponse> {
    return this.get<ProfileGetResponse>('profile');
  }
  setNewsletter(subscribed: boolean): Observable<void> {
    return subscribed ? this.put('profile/newsletter') : this.delete('profile/newsletter');
  }
}
