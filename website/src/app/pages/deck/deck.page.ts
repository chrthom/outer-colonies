import { Component, OnInit } from '@angular/core';
import { DeckCard } from '../../../../../server/src/components/shared_interfaces/rest_api';
import { DeckApiService } from 'src/app/api/deck-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oc-page-deck',
  templateUrl: './deck.page.html',
  styleUrls: ['./deck.page.scss'],
})
export class DeckPage implements OnInit {
  readonly minCards = 60;
  readonly maxCards = 100;
  activeCards: DeckCard[] = [];
  reserveCards: DeckCard[] = [];
  constructor(
    private deckApiService: DeckApiService
  ) {}
  ngOnInit() {
    this.reload();
  }
  reload() {
    this.deckApiService.listDeck().subscribe((res) => {
      if (res) {
        this.activeCards = res.cards.filter((c) => c.inUse).sort(this.cardSortFn);
        this.reserveCards = res.cards.filter((c) => !c.inUse).sort(this.cardSortFn);
      }
    });
  }
  activateCard(card: DeckCard) {
    if (this.activeCards.length < this.maxCards)
      this.deckApiService.activateCard(card.id).subscribe((_) => this.reload());
  }
  deactivateCard(card: DeckCard) {
    if (this.activeCards.length > this.minCards)
      this.deckApiService.deactivateCard(card.id).subscribe((_) => this.reload());
  }
  toCardUrl(cardId: number): string {
    return `${this.cardsUrl}/${cardId}.png`;
  }
  get cardsUrl(): string {
    return `${environment.url.assets}/cards`;
  }
  private cardSortFn(a: DeckCard, b: DeckCard): number {
    if (a.type > b.type) return -1;
    else if (a.type < b.type) return 1;
    else if (a.name < b.name) return -1;
    else if (a.name > b.name) return 1;
    else return 0;
  }
}
