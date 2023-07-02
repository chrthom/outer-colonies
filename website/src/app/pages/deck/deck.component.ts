import { Component } from '@angular/core';
import ApiService from 'src/app/api.service';
import AuthService from 'src/app/auth.service';

@Component({
  selector: 'oc-page-deck',
  templateUrl: './deck.component.html',
  styleUrls: ['./deck.component.scss']
})
export class DeckPage {
  constructor(private apiService: ApiService, private authService: AuthService) {
    apiService.listDeck(authService.sessionToken).subscribe(console.log); ////
  }
}
