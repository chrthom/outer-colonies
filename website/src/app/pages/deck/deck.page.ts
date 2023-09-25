import { Component, OnInit } from '@angular/core';
import { DeckCard } from '../../../../../server/src/shared/interfaces/rest_api';
import { DeckApiService } from 'src/app/api/deck-api.service';
import { environment } from 'src/environments/environment';
import * as _ from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { CardType, TacticDiscipline } from '../../../../../server/src/shared/config/enums';
import { Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ImageModalComponent } from 'src/app/components/image-modal/image-modal.component';

@Component({
  selector: 'oc-page-deck',
  templateUrl: './deck.page.html',
  styleUrls: ['./deck.page.scss']
})
export class DeckPage implements OnInit {
  readonly minCards = 60;
  readonly maxCards = 100;
  boxes!: DeckBox[];
  filterFormControl = new FormControl('');
  viewFormControl = new FormControl('list');
  private $activeCards: BehaviorSubject<DeckCardStack[]> = new BehaviorSubject(<DeckCardStack[]>[]);
  private $reserveCards: BehaviorSubject<DeckCardStack[]> = new BehaviorSubject(<DeckCardStack[]>[]);
  private readonly statisticsTemplate: DeckStatisticsTemplate[] = [
    {
      title: '&Delta;',
      get: (card: DeckCard) => card.profile.delta
    },
    {
      title: '&Theta;',
      get: (card: DeckCard) => card.profile.theta
    },
    {
      title: '&Xi;',
      get: (card: DeckCard) => card.profile.xi
    },
    {
      title: '&Phi;',
      get: (card: DeckCard) => card.profile.phi
    },
    {
      title: '&Psi;',
      get: (card: DeckCard) => card.profile.psi
    },
    {
      title: '&Omega;',
      get: (card: DeckCard) => card.profile.omega
    },
    {
      energyIcon: true,
      get: (card: DeckCard) => card.profile.energy
    }
  ];

  constructor(
    private deckApiService: DeckApiService,
    private dialog: MatDialog
  ) {}
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
        this.$activeCards.next(this.groupDeckCards(res.cards.filter(dc => dc.inUse)));
        this.$reserveCards.next(this.groupDeckCards(res.cards.filter(dc => !dc.inUse)));
      }
    });
  }
  activateCard(card: DeckCard) {
    if (this.canActivateDeckCard) {
      this.deckApiService.activateCard(card.id).subscribe(() => this.update());
    }
  }
  deactivateCard(card: DeckCard) {
    if (this.canDeactivateDeckCard) {
      this.deckApiService.deactivateCard(card.id).subscribe(() => this.update());
    }
  }
  openImgInModal(card: DeckCard) {
    this.dialog.open(ImageModalComponent, {
      data: this.cardIdToUrl(card.cardId),
      height: '95vh',
      maxHeight: '95vh'
    });
  }
  cardIdToUrl(cardId: number): string {
    return `${environment.url.assets}/cards/${cardId}.png`;
  }
  cardIdToEditionUrl(cardId: number): string {
    return this.toIconUrl(`edition${Math.floor(cardId / 100)}`);
  }
  cardIdToEditionName(cardId: number): string {
    switch (Math.floor(cardId / 100)) {
      case 1:
        return 'Outer Colonies';
      case 2:
        return 'Jovians Freihändler';
      case 3:
        return 'Marsianische Hegemonie';
      case 4:
        return 'Kuiper-Gürtel';
      default:
        return '';
    }
  }
  cardTypeToUrl(cardType: CardType): string {
    return this.toIconUrl(cardType);
  }
  rangeToUrl(range: number): string {
    return `${environment.url.assets}/utils/range${range}.png`;
  }
  toIconUrl(name: string): string {
    return `${environment.url.assets}/icons/${name}.png`;
  }
  disciplineToText(discipline?: TacticDiscipline): string {
    switch (discipline) {
      case TacticDiscipline.Intelligence:
        return 'Information';
      case TacticDiscipline.Military:
        return 'Militär';
      case TacticDiscipline.Science:
        return 'Wissenschaft';
      case TacticDiscipline.Trade:
        return 'Wirtschaft';
      default:
        return '';
    }
  }
  get statistics(): DeckStatistics[] {
    return this.statisticsTemplate.map(st => {
      const profileValues = this.$activeCards.value.map(st.get);
      return {
        title: st.title,
        energyIcon: st.energyIcon,
        used: -profileValues.filter(v => v < 0).reduce((a, b) => a + b, 0),
        provided: profileValues.filter(v => v > 0).reduce((a, b) => a + b, 0)
      };
    });
  }
  get canActivateDeckCard() {
    return cardsNum(this.boxes[0].cards) < this.maxCards;
  }
  get canDeactivateDeckCard() {
    return cardsNum(this.boxes[0].cards) > this.minCards;
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
  private _onClick!: (card: DeckCard, page: DeckPage) => void;
  private page!: DeckPage;
  private sort?: Sort;
  constructor(
    $cards: BehaviorSubject<DeckCardStack[]>,
    title: string,
    onClick: (card: DeckCard, page: DeckPage) => void,
    page: DeckPage
  ) {
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
    return this.sortCards(
      this.cards.filter(c => {
        const filter = this.page.filterFormControl.value;
        return !filter || c.type == filter;
      })
    );
  }
  get isActiveDeck(): boolean {
    return this._title == 'Aktives Deck';
  }
  onClick(card: DeckCard) {
    this._onClick(card, this.page);
  }
  setSort(sort: Sort) {
    this.sort = sort;
  }
  private sortCards(cardStacks: DeckCardStack[]): DeckCardStack[] {
    if (!this.sort || !this.sort.active || this.sort.direction == '') {
      return cardStacks;
    } else {
      const isAsc = this.sort.direction == 'asc';
      return cardStacks.sort((a, b) => {
        switch (this.sort?.active) {
          case 'amount':
            return compare(a.numOfCards, b.numOfCards, isAsc);
          case 'id':
            return compare(a.cardId, b.cardId, isAsc);
          case 'name':
            return compare(a.name, b.name, isAsc);
          case 'type':
            return compare(a.type, b.type, isAsc);
          case 'discipline':
            return compare(a.discipline, b.discipline, isAsc);
          case 'attack':
            return compare(
              !a.damage || !a.range ? undefined : a.damage * a.range,
              !b.damage || !b.range ? undefined : b.damage * b.range,
              isAsc
            );
          case 'defense':
            return compare(a.defense ? a.defense : a.hp, b.defense ? b.defense : b.hp, isAsc);
          case 'rarity':
            return compare(a.rarity, b.rarity, isAsc);
          case 'edition':
            return compare(Math.floor(a.cardId / 100), Math.floor(b.cardId / 100), isAsc);
          default:
            return 0;
        }
      });
    }
  }
}

function compare(a: number | string | undefined, b: number | string | undefined, isAsc: boolean) {
  if (a == undefined) return 1;
  else if (b == undefined) return -1;
  else return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

function cardsNum(cards: DeckCardStack[]): number {
  return cards.map(dc => dc.numOfCards).reduce((a, b) => a + b, 0);
}

interface DeckCardStack extends DeckCard {
  numOfCards: number;
}

interface DeckStatisticsTemplate {
  title?: string;
  energyIcon?: boolean;
  get: (card: DeckCard) => number;
}

interface DeckStatistics {
  title?: string;
  energyIcon?: boolean;
  used: number;
  provided: number;
}
