import { Component, OnInit } from '@angular/core';
import { DeckCard } from '../../../../../server/src/components/shared_interfaces/rest_api';
import { DeckApiService } from 'src/app/api/deck-api.service';
import { environment } from 'src/environments/environment';
import * as _ from 'lodash-es';

interface DeckCardStack extends DeckCard {
  numOfCards: number;
}

@Component({
  selector: 'oc-page-deck',
  templateUrl: './deck.page.html',
  styleUrls: ['./deck.page.scss'],
})
export class DeckPage implements OnInit {
  readonly minCards = 60;
  readonly maxCards = 100;
  activeCards: DeckCardStack[] = [];
  reserveCards: DeckCardStack[] = [];
  constructor(private deckApiService: DeckApiService) {}
  ngOnInit() {
    this.update();
  }
  update() {
    this.deckApiService.listDeck().subscribe((res) => {
      if (res) {
        this.activeCards = this.groupDeckCards(res.cards.filter((dc) => dc.inUse)).sort(this.cardSortFn);
        this.reserveCards = this.groupDeckCards(res.cards.filter((dc) => !dc.inUse)).sort(this.cardSortFn);
      }
    });
  }
  activateCard(card: DeckCard) {
    if (this.activeCardsNum < this.maxCards) {
      this.deckApiService.activateCard(card.id).subscribe((_) => this.update());
    }
  }
  deactivateCard(card: DeckCard) {
    if (this.activeCardsNum > this.minCards) {
      this.deckApiService.deactivateCard(card.id).subscribe((_) => this.update());
    }
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
  private groupDeckCards(deckCards: DeckCard[]): DeckCardStack[] {
    return Object.values(_.groupBy(deckCards, (dc) => dc.cardId)).map((dc) => {
      const stack = <DeckCardStack>dc[0];
      stack.numOfCards = dc.length;
      return stack;
    });
  }
  get activeCardsNum(): number {
    return this.activeCards.map((dc) => dc.numOfCards).reduce((a, b) => a + b, 0);
  }
  get reserveCardsNum(): number {
    return this.reserveCards.map((dc) => dc.numOfCards).reduce((a, b) => a + b, 0);
  }
}
