import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeckPage } from './deck.page';
import { RouterTestingModule } from '@angular/router/testing';
import { DeckApiService } from 'src/app/api/deck-api.service';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconService } from 'src/app/icon.service';

describe('DeckPage', () => {
  let component: DeckPage;
  let fixture: ComponentFixture<DeckPage>;
  let deckApiSpy: jasmine.SpyObj<DeckApiService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    deckApiSpy = jasmine.createSpyObj('DeckApiService', ['listDeck', 'activateCard', 'deactivateCard']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    deckApiSpy.listDeck.and.returnValue(
      of({
        cards: [
          {
            id: 1,
            cardId: 101,
            inUse: true,
            name: 'Card 1',
            type: 'hull' as any,
            discipline: 0 as any,
            rarity: 1,
            canAttack: true,
            profile: { delta: 1, theta: 0, xi: 0, phi: 0, psi: 0, omega: 0, energy: 2 }
          },
          {
            id: 2,
            cardId: 102,
            inUse: false,
            name: 'Card 2',
            type: 'equipment' as any,
            discipline: 1 as any,
            rarity: 2,
            canAttack: false,
            profile: { delta: 0, theta: 1, xi: 0, phi: 0, psi: 0, omega: 0, energy: 1 }
          },
          {
            id: 3,
            cardId: 103,
            inUse: true,
            name: 'Card 3',
            type: 'hull' as any,
            discipline: 0 as any,
            rarity: 1,
            canAttack: true,
            profile: { delta: 1, theta: 0, xi: 0, phi: 0, psi: 0, omega: 0, energy: 2 }
          }
        ]
      })
    );

    deckApiSpy.activateCard.and.returnValue(of(undefined));
    deckApiSpy.deactivateCard.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatCardModule,
        MatBadgeModule,
        MatTooltipModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonToggleModule,
        MatExpansionModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule
      ],
      declarations: [],
      providers: [
        { provide: DeckApiService, useValue: deckApiSpy },
        { provide: MatDialog, useValue: dialogSpy },
        IconService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeckPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should split loaded cards into active and reserve boxes by inUse', () => {
    expect(component.boxes[0].cards.length).toBe(2);
    expect(component.boxes[1].cards.length).toBe(1);
  });

  it('should call activateCard via the API when capacity allows', () => {
    component.activateCard({ id: 2, cardId: 102, inUse: false } as any);

    expect(deckApiSpy.activateCard).toHaveBeenCalledWith(2);
  });

  it('should produce the card image URL from cardId', () => {
    expect(component.cardIdToUrl(101)).toBe('https://assets.outercolonies.de/cards/101.png');
  });

  it('should produce the edition icon URL from cardId', () => {
    expect(component.cardIdToEditionUrl(101)).toBe('https://assets.outercolonies.de/icons/edition1.png');
  });

  it('should map cardId hundreds to the edition name', () => {
    expect(component.cardIdToEditionName(101)).toBe('Outer Colonies');
    expect(component.cardIdToEditionName(201)).toBe('Jovians Freihändler');
    expect(component.cardIdToEditionName(301)).toBe('Marsianische Hegemonie');
    expect(component.cardIdToEditionName(401)).toBe('Kuiper-Gürtel');
    expect(component.cardIdToEditionName(99)).toBe('');
  });

  it('should compute provided/used columns from the active card profiles', () => {
    component['activeCards$'].next([
      {
        id: 1,
        cardId: 101,
        inUse: true,
        numOfCards: 2,
        profile: { delta: 1, theta: -1, xi: 0, phi: 0, psi: 0, omega: 0, energy: 2 }
      } as any
    ]);

    component.statistics$.subscribe(stats => {
      expect(stats.length).toBe(7);
      expect(stats[0].provided).toBe(2);
      expect(stats[0].used).toBe(0);
      expect(stats[1].provided).toBe(0);
      expect(stats[1].used).toBe(2);
    });
  });
});
