import { BehaviorSubject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { DeckCard } from '@shared/interfaces/rest_api';
import { DeckCardStack } from './deck.types';

/**
 * Filter card stacks by card type and sort them by the given sort criteria.
 * Pure function - returns a new array and does not mutate the input.
 * @param cards The card stacks to filter and sort
 * @param filter The card type to filter by, or an empty string for no filter
 * @param sort The sort criteria, if the table is sorted
 * @returns The filtered and sorted card stacks
 */
export function filterAndSort(cards: DeckCardStack[], filter: string, sort?: Sort): DeckCardStack[] {
  const filtered = cards.filter(c => !filter || c.type == filter);
  if (!sort || !sort.active || sort.direction == '') {
    return filtered;
  }
  const isAsc = sort.direction == 'asc';
  return filtered.sort((a, b) => {
    switch (sort.active) {
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
        return compare(a.defense ?? a.hp, b.defense ?? b.hp, isAsc);
      case 'rarity':
        return compare(a.rarity, b.rarity, isAsc);
      case 'edition':
        return compare(Math.floor(a.cardId / 100), Math.floor(b.cardId / 100), isAsc);
      default:
        return 0;
    }
  });
}

/**
 * Get the total number of cards in the given card stacks.
 * @param cards The card stacks
 * @returns The sum of all cards over all stacks
 */
export function cardsNum(cards: DeckCardStack[]): number {
  return cards.map(dc => dc.numOfCards).reduce((a, b) => a + b, 0);
}

/**
 * A box of deck cards (active deck or reserve) with its own sort state,
 * filtered by the shared card type filter of the deck page.
 */
export class DeckBox {
  private $cards: BehaviorSubject<DeckCardStack[]>;
  private _title: string;
  private _isActive: boolean;
  private _onClick: (card: DeckCard) => void;
  private filterControl: FormControl;
  private sort?: Sort;

  constructor(
    $cards: BehaviorSubject<DeckCardStack[]>,
    title: string,
    isActive: boolean,
    onClick: (card: DeckCard) => void,
    filterControl: FormControl
  ) {
    this.$cards = $cards;
    this._title = title;
    this._isActive = isActive;
    this.filterControl = filterControl;
    this._onClick = onClick;
  }

  /** Title of the box including the number of visible and total cards. */
  get title(): string {
    return `${this._title} (${cardsNum(this.cardsFiltered)} / ${cardsNum(this.cards)} Karten)`;
  }

  /** All card stacks in this box. */
  get cards(): DeckCardStack[] {
    return this.$cards.getValue();
  }

  /** Card stacks in this box, filtered by card type and sorted by the current sort criteria. */
  get cardsFiltered(): DeckCardStack[] {
    return filterAndSort(this.cards, this.filterControl.value, this.sort);
  }

  /** Whether this box is the active deck (as opposed to the reserve). */
  get isActiveDeck(): boolean {
    return this._isActive;
  }

  /** Trigger the box action (activate or deactivate) for a card. */
  onClick(card: DeckCard) {
    this._onClick(card);
  }

  /** Update the sort criteria of this box. */
  setSort(sort: Sort) {
    this.sort = sort;
  }
}

/**
 * Compares two sort values, returning `0` for equal values.
 * An `undefined` value is offset in the current sort direction:
 * it lands at the end when sorting ascending and at the start when sorting descending.
 */
function compare(a: number | string | undefined, b: number | string | undefined, isAsc: boolean) {
  if (a == undefined && b == undefined) return 0;
  const offset = a == undefined ? 1 : b == undefined ? -1 : a < b ? -1 : a > b ? 1 : 0;
  return offset * (isAsc ? 1 : -1);
}
