import { Component, OnInit, inject } from '@angular/core';
import { DeckCard } from '@shared/interfaces/rest_api';
import { DeckApiService } from 'src/app/api/deck-api.service';
import * as _ from 'lodash-es';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconService } from '../../icon.service';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { ContentBoxComponent } from '../../components/content-box/content-box.component';
import { MatCard, MatCardImage } from '@angular/material/card';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
  MatExpansionPanelDescription
} from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { CardImageService } from 'src/app/card-image.service';
import { CardMetaService } from 'src/app/card-meta.service';
import { cardsNum, DeckBox } from './deck-box';
import { DeckCardStack, DeckStatistics, DeckStatisticsTemplate } from './deck.types';

@Component({
  selector: 'oc-page-deck',
  templateUrl: './deck.page.html',
  styleUrls: ['./deck.page.scss'],
  imports: [
    CommonModule,
    ContentBoxComponent,
    MatCard,
    MatBadge,
    MatCardImage,
    MatSort,
    MatSortHeader,
    MatTooltip,
    MatButton,
    MatFormField,
    MatLabel,
    MatSelect,
    FormsModule,
    ReactiveFormsModule,
    MatOption,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription
  ]
})
export class DeckPage implements OnInit {
  private deckApiService = inject(DeckApiService);
  protected readonly cardImage = inject(CardImageService);
  protected readonly cardMeta = inject(CardMetaService);
  protected readonly icons = inject(IconService);

  readonly minCards = 60;
  readonly maxCards = 100;
  loadFailed = false;
  actionFailed = false;
  filterFormControl = new FormControl('');
  viewFormControl = new FormControl('list');
  private activeCards$: BehaviorSubject<DeckCardStack[]> = new BehaviorSubject(<DeckCardStack[]>[]);
  private reserveCards$: BehaviorSubject<DeckCardStack[]> = new BehaviorSubject(<DeckCardStack[]>[]);
  boxes = [
    new DeckBox(this.activeCards$, 'Aktives Deck', this.filterFormControl, card => this.deactivateCard(card)),
    new DeckBox(this.reserveCards$, 'Reserve', this.filterFormControl, card => this.activateCard(card))
  ];
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
  statistics$: Observable<DeckStatistics[]> = this.activeCards$.pipe(
    map(() => {
      return this.statisticsTemplate.map(st => {
        const profileValues = this.activeCards$.value.map(dcs => st.get(dcs) * dcs.numOfCards);
        return {
          title: st.title,
          energyIcon: st.energyIcon,
          used: -profileValues.filter(v => v < 0).reduce((a, b) => a + b, 0),
          provided: profileValues.filter(v => v > 0).reduce((a, b) => a + b, 0)
        };
      });
    })
  );
  ngOnInit() {
    this.update();
  }
  update() {
    this.loadFailed = false;
    this.deckApiService.listDeck().subscribe({
      next: res => {
        this.activeCards$.next(this.groupDeckCards(res.cards.filter(dc => dc.inUse)));
        this.reserveCards$.next(this.groupDeckCards(res.cards.filter(dc => !dc.inUse)));
      },
      error: () => (this.loadFailed = true)
    });
  }
  activateCard(card: DeckCard) {
    if (this.canActivateDeckCard) {
      this.actionFailed = false;
      this.deckApiService.activateCard(card.id).subscribe({
        next: () => this.update(),
        error: () => (this.actionFailed = true)
      });
    }
  }
  deactivateCard(card: DeckCard) {
    if (this.canDeactivateDeckCard) {
      this.actionFailed = false;
      this.deckApiService.deactivateCard(card.id).subscribe({
        next: () => this.update(),
        error: () => (this.actionFailed = true)
      });
    }
  }

  get canActivateDeckCard() {
    return cardsNum(this.boxes[0].cards) < this.maxCards;
  }
  get canDeactivateDeckCard() {
    return cardsNum(this.boxes[0].cards) > this.minCards;
  }
  private groupDeckCards(deckCards: DeckCard[]): DeckCardStack[] {
    return Object.values(_.groupBy(deckCards, (dc: DeckCard) => dc.cardId)).map((dc: DeckCard[]) => {
      const stack = dc[0] as DeckCardStack;
      stack.numOfCards = dc.length;
      return stack;
    });
  }
}
