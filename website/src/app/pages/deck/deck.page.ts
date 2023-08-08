import { Component, OnInit } from '@angular/core';
import { DeckCard } from '../../../../../server/src/components/shared_interfaces/rest_api';
import { DeckApiService } from 'src/app/api/deck-api.service';
import { environment } from 'src/environments/environment';
import * as _ from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { CardType } from '../../../../../server/src/components/config/enums';

interface DeckCardStack extends DeckCard {
  numOfCards: number;
}

@Component({
  selector: 'oc-page-deck',
  templateUrl: './deck.page.html',
  styleUrls: ['./deck.page.scss']
})
export class DeckPage implements OnInit {
  readonly minCards = 60;
  readonly maxCards = 100;
  filterFormControl = new FormControl('');
  viewFormControl = new FormControl('list');
  private $activeCards: BehaviorSubject<DeckCardStack[]> = new BehaviorSubject(<DeckCardStack[]>[]);
  private $reserveCards: BehaviorSubject<DeckCardStack[]> = new BehaviorSubject(<DeckCardStack[]>[]);
  boxes!: DeckBox[];
  constructor(private deckApiService: DeckApiService) {}
  ngOnInit() {
    this.boxes = [
      new DeckBox(this.$activeCards, 'Aktives Deck', (card, page) => page.deactivateCard(card), this),
      new DeckBox(this.$reserveCards, 'Reserve', (card, page) => page.activateCard(card), this)
    ];
    this.update();
  }
  update() {
    this.deckApiService.listDeck().subscribe(res => {
      if (res) {
        this.$activeCards.next(this.groupDeckCards(res.cards.filter(dc => dc.inUse)).sort(this.cardSortFn));
        this.$reserveCards.next(this.groupDeckCards(res.cards.filter(dc => !dc.inUse)).sort(this.cardSortFn));
      }
    });
  }
  activateCard(card: DeckCard) {
    if (this.canActivateDeckCard) {
      this.deckApiService.activateCard(card.id).subscribe(_ => this.update());
    }
  }
  deactivateCard(card: DeckCard) {
    if (this.canDeactivateDeckCard) {
      this.deckApiService.deactivateCard(card.id).subscribe(_ => this.update());
    }
  }
  get canActivateDeckCard() {
    return cardsNum(this.boxes[0].cards) < this.maxCards;
  }
  get canDeactivateDeckCard() {
    return cardsNum(this.boxes[0].cards) > this.minCards;
  }
  cardIdToCardUrl(cardId: number): string {
    return `${this.cardsUrl}/${cardId}.png`;
  }
  cardIdToEditionName(cardId: number): string {
    switch (Math.floor(cardId / 100)) {
      case 1: return 'Outer Colonies';
      case 2: return 'Jovians Freihändler';
      case 3: return 'Marsianische Hegemonie';
      case 4: return 'Kuiper-Gürtel';
      default: '';
    }
    return `${this.cardsUrl}/${cardId}.png`;
  }
  typeToText(cardType: CardType): string {
    switch (cardType) {
      case CardType.Equipment: return 'Ausrüstung';
      case CardType.Hull: return 'Rumpf';
      case CardType.Infrastructure: return 'Infrastruktur';
      case CardType.Tactic: return 'Taktik';
      default: return '';
    }
  }
  private get cardsUrl(): string {
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
    return Object.values(_.groupBy(deckCards, dc => dc.cardId)).map(dc => {
      const stack = <DeckCardStack>dc[0];
      stack.numOfCards = dc.length;
      return stack;
    });
  }
}

class DeckBox {
  private $cards!: BehaviorSubject<DeckCardStack[]>;
  private _title!: string;
  private _onClick!: (card: DeckCard,  page: DeckPage) => void;
  private page!: DeckPage;
  constructor($cards: BehaviorSubject<DeckCardStack[]>, title: string, onClick: (card: DeckCard, page: DeckPage) => void, page: DeckPage) {
    this.$cards = $cards;
    this._title = title;
    this._onClick = onClick;
    this.page = page;
  }
  get title(): string {
    return `${this._title} (${cardsNum(this.cardsFiltered)} / ${cardsNum(this.cards)} Karten)`;
  }
  get cards(): DeckCardStack[] {
    return this.$cards.getValue();
  }
  get cardsFiltered() {
    return this.cards.filter(c => {
      const filter = this.page.filterFormControl.value;
      return !filter || c.type == filter;
    });
  }
  get isActiveDeck(): boolean {
    return this._title == 'Aktives Deck';
  }
  onClick(card: DeckCard) {
    this._onClick(card, this.page);
  }
}

function cardsNum(cards: DeckCardStack[]): number {
  return cards.map(dc => dc.numOfCards).reduce((a, b) => a + b, 0);
}