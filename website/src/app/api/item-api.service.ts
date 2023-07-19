import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ItemListResponse } from '../../../../server/src/components/shared_interfaces/rest_api';
import AuthService from '../auth.service';
import OCApiWithAuth from './api-with-auth';

@Injectable({
  providedIn: 'root'
})
export class ItemApiService extends OCApiWithAuth {
  constructor(authService: AuthService, http: HttpClient) {
    super(authService, http);
  }
  get items(): Observable<ItemListResponse | undefined> {
    return this.get<ItemListResponse>('item', this.token).pipe(
      map((res) => {
        const result = res.status >= 200 && res.status < 300 && res.body != null ? res.body : undefined;
        return result;
      }),
    );
  }
}
