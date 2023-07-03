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
  ngOnInit() {
    this.reload();
  }
  reload() {
    if (this.authService.sessionToken) {
      this.apiService.listDeck(this.authService.sessionToken).subscribe(res => {
        if (res) {
          this.activeCards = res.cards.filter(c => c.inUse).sort(this.cardSortFn);
          this.reserveCards = res.cards.filter(c => !c.inUse).sort(this.cardSortFn);
        }
      });
    } else {
      setTimeout(this.reload, 300);
    }
  }
  removeCard(card: DeckCard) {
    if (this.authService.sessionToken)
      this.apiService
        .deactivateCard(this.authService.sessionToken, card.id)
        .subscribe(_ => this.reload());
  }
  private cardSortFn(a: DeckCard, b:DeckCard): number {
    if (a.type > b.type) return -1;
    else if (a.type < b.type) return 1;
    else if (a.name < b.name) return -1;
    else if (a.name > b.name) return 1;
    else return 0;
  }
}
