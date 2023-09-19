import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ItemListResponse,
  OpenItemResponse
} from '../../../../server/src/components/shared_interfaces/rest_api';
import AuthService from '../auth.service';
import OCApi from './api';

@Injectable({
  providedIn: 'root'
})
export class ItemApiService extends OCApi {
  constructor(
    private authService: AuthService,
    http: HttpClient
  ) {
    super(http);
  }
  get items(): Observable<ItemListResponse | undefined> {
    return this.get<ItemListResponse>('item', this.authService.token);
  }
  buyBooster(boosterNo: number): Observable<any> {
    return this.post(`buy/booster/${boosterNo}`, this.authService.token);
  }
  open(itemId: number): Observable<OpenItemResponse | undefined> {
    return this.post<OpenItemResponse>(`item/${itemId}`, this.authService.token);
  }
}
