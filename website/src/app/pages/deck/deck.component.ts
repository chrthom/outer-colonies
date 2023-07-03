import { Component, OnInit } from '@angular/core';
import ApiService from 'src/app/api.service';
import AuthService from 'src/app/auth.service';
import { DeckCard } from '../../../../../server/src/components/shared_interfaces/rest_api';

@Component({
  selector: 'oc-page-deck',
  templateUrl: './deck.component.html',
  styleUrls: ['./deck.component.scss']
})
export class DeckPage implements OnInit {
  activeCards!: DeckCard[];
  reserveCards!: DeckCard[];
  constructor(private apiService: ApiService, private authService: AuthService) {}
  ngOnInit(): void {
    this.reload();
  }
  reload() {
    this.apiService.listDeck(this.authService.sessionToken).subscribe(res => {
      if (res) {
        this.activeCards = res.activeCards;
        this.reserveCards = res.reserveCards;
      }
    });
  }
}
