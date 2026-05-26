import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DeckListResponse } from '../../../../server/src/shared/interfaces/rest_api';
import OCApi from './api';

@Injectable({
  providedIn: 'root'
})
export class DeckApiService extends OCApi {
  constructor() {
    const http = inject(HttpClient);

    super(http);
  }
  listDeck(): Observable<DeckListResponse> {
    return this.get<DeckListResponse>('deck');
  }
  activateCard(cardInstanceId: number): Observable<void> {
    return this.post(`deck/${cardInstanceId}`);
  }
  deactivateCard(cardInstanceId: number): Observable<void> {
    return this.delete(`deck/${cardInstanceId}`);
  }
}
