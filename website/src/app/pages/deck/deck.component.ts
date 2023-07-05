import { Component, OnInit } from '@angular/core';
import AuthService from 'src/app/auth.service';
import { DeckCard } from '../../../../../server/src/components/shared_interfaces/rest_api';
import { DeckApiService } from 'src/app/api/deck-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-page-deck',
  templateUrl: './deck.component.html',
  styleUrls: ['./deck.component.scss']
})
export class DeckPage implements OnInit {
  readonly minCards = 60;
  readonly maxCards = 100;
  activeCards: DeckCard[] = [];
  reserveCards: DeckCard[] = [];
  constructor(private deckAPService: DeckApiService, private authService: AuthService) {}
  ngOnInit() {
    this.reload();
  }
  reload() {
    this.deckAPService.listDeck().subscribe(res => {
      if (res) {
        this.activeCards = res.cards.filter(c => c.inUse).sort(this.cardSortFn);
        this.reserveCards = res.cards.filter(c => !c.inUse).sort(this.cardSortFn);
      }
    });
  }
  activateCard(card: DeckCard) {
    if (this.activeCards.length < this.maxCards)
      this.deckAPService
        .activateCard(card.id)
        .subscribe(_ => this.reload());
  }
  deactivateCard(card: DeckCard) {
    if (this.activeCards.length > this.minCards)
      this.deckAPService
        .deactivateCard(card.id)
        .subscribe(_ => this.reload());
  }
  toAssetUrl(cardId: number): string {
    return `${this.assetsUrl}/${cardId}.png`;
  }
  get assetsUrl(): string {
    return environment.url.assets;
  }
  private cardSortFn(a: DeckCard, b:DeckCard): number {
    if (a.type > b.type) return -1;
    else if (a.type < b.type) return 1;
    else if (a.name < b.name) return -1;
    else if (a.name > b.name) return 1;
    else return 0;
  }
}
