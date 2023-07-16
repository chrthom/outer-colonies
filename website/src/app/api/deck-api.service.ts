import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DeckListResponse } from '../../../../server/src/components/shared_interfaces/rest_api';
import OCApi from './api';
import AuthService from '../auth.service';

@Injectable({
  providedIn: 'root',
})
export class DeckApiService extends OCApi {
  constructor(
    private authService: AuthService,
    http: HttpClient,
  ) {
    super(http);
  }
  listDeck(): Observable<DeckListResponse | undefined> {
    return this.get<DeckListResponse>('deck', this.token).pipe(
      map((res) => {
        const result = res.status >= 200 && res.status < 300 && res.body != null ? res.body : undefined;
        return result;
      }),
    );
  }
  activateCard(cardInstanceId: number): Observable<void> {
    return this.post(`deck/${cardInstanceId}`, this.token).pipe(map((_) => {}));
  }
  deactivateCard(cardInstanceId: number): Observable<void> {
    return this.delete(`deck/${cardInstanceId}`, this.token).pipe(map((_) => {}));
  }
  private get token(): string {
    return this.authService.sessionToken ? this.authService.sessionToken : '';
  }
}
