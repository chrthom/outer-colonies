import { FormControl } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { BehaviorSubject } from 'rxjs';
import { CardType, TacticDiscipline } from '@shared/config/enums';
import { cardsNum, DeckBox, filterAndSort } from './deck-box';
import { DeckCardStack } from './deck.types';

function stack(overrides: Partial<DeckCardStack>): DeckCardStack {
  return {
    id: 0,
    inUse: true,
    cardId: 101,
    name: 'Card 101',
    rarity: 1,
    type: CardType.Hull,
    canAttack: false,
    profile: { energy: 0, theta: 0, xi: 0, phi: 0, omega: 0, delta: 0, psi: 0 },
    numOfCards: 1,
    ...overrides
  };
}

describe('filterAndSort', () => {
  let cards: DeckCardStack[];

  beforeEach(() => {
    cards = [
      stack({ cardId: 201, name: 'Zeta', type: CardType.Equipment, numOfCards: 3, rarity: 2 }),
      stack({ cardId: 101, name: 'Alpha', type: CardType.Hull, numOfCards: 1, rarity: 0 }),
      stack({
        cardId: 302,
        name: 'Beta',
        type: CardType.Tactic,
        numOfCards: 2,
        rarity: 1,
        discipline: TacticDiscipline.Military
      }),
      stack({ cardId: 452, name: 'Gamma', type: CardType.Orb, numOfCards: 4, rarity: 5 })
    ];
  });

  it('returns all cards in original order without filter and sort', () => {
    expect(filterAndSort(cards, '')).toEqual(cards);
  });

  it('returns all cards in original order for an inactive sort', () => {
    expect(filterAndSort(cards, '', { active: 'id', direction: '' })).toEqual(cards);
  });

  it('filters cards by type', () => {
    expect(filterAndSort(cards, 'hull').map(c => c.cardId)).toEqual([101]);
    expect(filterAndSort(cards, 'orb').map(c => c.cardId)).toEqual([452]);
  });

  it('does not mutate the input array', () => {
    const input = [cards[0], cards[1]];

    const sorted = filterAndSort(input, '', { active: 'id', direction: 'asc' });

    expect(sorted.map(c => c.cardId)).toEqual([101, 201]);
    expect(input.map(c => c.cardId)).toEqual([201, 101]);
  });

  it('sorts by amount, id, name, type, rarity and edition in both directions', () => {
    const expectedAscending: Record<string, number[]> = {
      amount: [101, 302, 201, 452],
      id: [101, 201, 302, 452],
      name: [101, 302, 452, 201],
      type: [201, 101, 452, 302],
      rarity: [101, 302, 201, 452],
      edition: [101, 201, 302, 452]
    };

    for (const [column, ascending] of Object.entries(expectedAscending)) {
      const sort: Sort = { active: column, direction: 'asc' };
      expect(filterAndSort(cards, '', sort).map(c => c.cardId)).toEqual(ascending);

      sort.direction = 'desc';
      expect(filterAndSort(cards, '', sort).map(c => c.cardId)).toEqual(ascending.slice().reverse());
    }
  });

  it('sorts by discipline, offsetting cards without discipline by sort direction', () => {
    const withDiscipline = stack({ cardId: 302, discipline: TacticDiscipline.Military });
    const withoutDiscipline = stack({ cardId: 101 });

    const asc = filterAndSort([withoutDiscipline, withDiscipline], '', {
      active: 'discipline',
      direction: 'asc'
    });
    const desc = filterAndSort([withoutDiscipline, withDiscipline], '', {
      active: 'discipline',
      direction: 'desc'
    });

    expect(asc.map(c => c.cardId)).toEqual([302, 101]);
    expect(desc.map(c => c.cardId)).toEqual([101, 302]);
  });

  it('sorts by attack value (damage x range), offsetting cards without weapons by sort direction', () => {
    const weak = stack({ cardId: 101, damage: 4, range: 2 });
    const strong = stack({ cardId: 152, damage: 3, range: 3 });
    const noWeapon = stack({ cardId: 201 });

    const asc = filterAndSort([noWeapon, strong, weak], '', { active: 'attack', direction: 'asc' });
    const desc = filterAndSort([noWeapon, strong, weak], '', { active: 'attack', direction: 'desc' });

    expect(asc.map(c => c.cardId)).toEqual([101, 152, 201]);
    expect(desc.map(c => c.cardId)).toEqual([201, 152, 101]);
  });

  it('treats weapons without range as no attack value', () => {
    const withRange = stack({ cardId: 101, damage: 4, range: 2 });
    const withoutRange = stack({ cardId: 302, damage: 5 });

    const result = filterAndSort([withoutRange, withRange], '', { active: 'attack', direction: 'asc' });

    expect(result.map(c => c.cardId)).toEqual([101, 302]);
  });

  it('sorts by defense with hp as fallback, offsetting cards without either by sort direction', () => {
    const lowHp = stack({ cardId: 102, hp: 3 });
    const highHp = stack({ cardId: 103, hp: 7 });
    const withDefense = stack({ cardId: 101, defense: 'armour_1' });
    const without = stack({ cardId: 104 });

    const byHp = filterAndSort([highHp, lowHp], '', { active: 'defense', direction: 'asc' });
    expect(byHp.map(c => c.cardId)).toEqual([102, 103]);

    const byDefense = filterAndSort([without, withDefense], '', { active: 'defense', direction: 'asc' });
    expect(byDefense.map(c => c.cardId)).toEqual([101, 104]);

    const byDefenseDesc = filterAndSort([without, withDefense], '', { active: 'defense', direction: 'desc' });
    expect(byDefenseDesc.map(c => c.cardId)).toEqual([104, 101]);
  });

  it('keeps the original order of equal values', () => {
    const first = stack({ cardId: 104, name: 'Same' });
    const second = stack({ cardId: 105, name: 'Same' });

    const result = filterAndSort([first, second], '', { active: 'name', direction: 'asc' });

    expect(result.map(c => c.cardId)).toEqual([104, 105]);
  });

  it('keeps the original order when both compared values are undefined', () => {
    const first = stack({ cardId: 106, name: 'X-Ray' });
    const second = stack({ cardId: 107, name: 'Yankee' });

    const result = filterAndSort([first, second], '', { active: 'attack', direction: 'asc' });

    expect(result.map(c => c.cardId)).toEqual([106, 107]);
  });

  it('keeps the original order for an unknown sort column', () => {
    expect(filterAndSort(cards, '', { active: 'unknown', direction: 'asc' })).toEqual(cards);
  });
});

describe('cardsNum', () => {
  it('sums up the cards over all stacks', () => {
    const cards = [stack({ cardId: 101, numOfCards: 2 }), stack({ cardId: 102, numOfCards: 3 })];

    expect(cardsNum(cards)).toBe(5);
  });

  it('returns 0 for an empty list', () => {
    expect(cardsNum([])).toBe(0);
  });
});

describe('DeckBox', () => {
  let cards: DeckCardStack[];
  let $cards: BehaviorSubject<DeckCardStack[]>;
  let filterControl: FormControl;
  let onClick: jasmine.Spy;

  beforeEach(() => {
    cards = [
      stack({ cardId: 201, type: CardType.Equipment, numOfCards: 3 }),
      stack({ cardId: 101, type: CardType.Hull, numOfCards: 2 })
    ];
    $cards = new BehaviorSubject<DeckCardStack[]>(cards);
    filterControl = new FormControl('');
    onClick = jasmine.createSpy('onClick');
  });

  it('exposes the cards of its behavior subject', () => {
    const box = new DeckBox($cards, 'Reserve', false, onClick, filterControl);

    expect(box.cards).toEqual(cards);
  });

  it('applies the filter control value to cardsFiltered', () => {
    const box = new DeckBox($cards, 'Reserve', false, onClick, filterControl);

    expect(box.cardsFiltered.map(c => c.cardId)).toEqual([201, 101]);

    filterControl.setValue('hull');
    expect(box.cardsFiltered.map(c => c.cardId)).toEqual([101]);
  });

  it('applies the sort set via setSort to cardsFiltered', () => {
    const box = new DeckBox($cards, 'Reserve', false, onClick, filterControl);

    box.setSort({ active: 'id', direction: 'asc' });
    expect(box.cardsFiltered.map(c => c.cardId)).toEqual([101, 201]);

    box.setSort({ active: 'id', direction: 'desc' });
    expect(box.cardsFiltered.map(c => c.cardId)).toEqual([201, 101]);
  });

  it('shows filtered and total card counts in the title', () => {
    const box = new DeckBox($cards, 'Reserve', false, onClick, filterControl);
    expect(box.title).toBe('Reserve (5 / 5 Karten)');

    filterControl.setValue('hull');
    expect(box.title).toBe('Reserve (2 / 5 Karten)');
  });

  it('is the active deck only when constructed with the active flag', () => {
    expect(new DeckBox($cards, 'Aktives Deck', true, onClick, filterControl).isActiveDeck).toBeTrue();
    expect(new DeckBox($cards, 'Reserve', false, onClick, filterControl).isActiveDeck).toBeFalse();
  });

  it('triggers the configured action on click', () => {
    const box = new DeckBox($cards, 'Reserve', false, onClick, filterControl);

    box.onClick(cards[0]);

    expect(onClick).toHaveBeenCalledWith(cards[0]);
  });
});
