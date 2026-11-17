import { Component, OnInit, inject } from '@angular/core';
import { DeckCard } from '@shared/interfaces/rest_api';
import { DeckApiService } from 'src/app/api/deck-api.service';
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
    new DeckBox(
      this.activeCards$,
      'Aktives Deck',
      true,
      card => this.deactivateCard(card),
      this.filterFormControl
    ),
    new DeckBox(this.reserveCards$, 'Reserve', false, card => this.activateCard(card), this.filterFormControl)
  ];
  private readonly statisticsTemplate: DeckStatisticsTemplate[] = [
    {
      title: 'Δ',
      get: (card: DeckCard) => card.profile.delta
    },
    {
      title: 'Θ',
      get: (card: DeckCard) => card.profile.theta
    },
    {
      title: 'Ξ',
      get: (card: DeckCard) => card.profile.xi
    },
    {
      title: 'Φ',
      get: (card: DeckCard) => card.profile.phi
    },
    {
      title: 'Ψ',
      get: (card: DeckCard) => card.profile.psi
    },
    {
      title: 'Ω',
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
  /**
   * Full CSS class list rendering the icon font glyph for the given icon name.
   * @param name The icon name (e.g. a card type or defense token)
   * @returns The CSS classes (e.g. 'oc-icon oc-icon-hull')
   */
  iconClass(name: string): string {
    return `oc-icon ${this.icons.getIconClass(name)}`;
  }
  get canActivateDeckCard() {
    return cardsNum(this.boxes[0].cards) < this.maxCards;
  }
  get canDeactivateDeckCard() {
    return cardsNum(this.boxes[0].cards) > this.minCards;
  }
  private groupDeckCards(deckCards: DeckCard[]): DeckCardStack[] {
    const stacks = new Map<number, DeckCardStack>();
    for (const dc of deckCards) {
      const stack = stacks.get(dc.cardId);
      if (stack) {
        stack.numOfCards++;
      } else {
        stacks.set(dc.cardId, { ...dc, numOfCards: 1 });
      }
    }
    return [...stacks.values()].sort((a, b) => a.cardId - b.cardId);
  }
}
