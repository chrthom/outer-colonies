import { CardType } from '../../../shared/config/enums';
import Card from '../card';
import CardStack from '../card_stack';
import HullCard, { toHullMultipart } from './hull_card';

class TestHull extends HullCard {
  override getValidTargets(): CardStack[] {
    return [];
  }
}

const newHull = (requiredParts: number) =>
  new TestHull(1, 'Test Hull', 1, toHullMultipart(requiredParts, false));

const card = (type: CardType) => ({ type }) as Card;

describe('HullCard.isFlightReady', () => {
  test('1-part hull is ready with a single hull card', () => {
    expect(newHull(1).isFlightReady([card(CardType.Hull)])).toBe(true);
  });

  test('2-part hull is not ready with one hull card', () => {
    expect(newHull(2).isFlightReady([card(CardType.Hull)])).toBe(false);
  });

  test('2-part hull is ready with exactly two hull cards', () => {
    expect(newHull(2).isFlightReady([card(CardType.Hull), card(CardType.Hull)])).toBe(true);
  });

  test('3-part hull is not ready with two hull cards', () => {
    expect(newHull(3).isFlightReady([card(CardType.Hull), card(CardType.Hull)])).toBe(false);
  });

  test('non-hull cards are excluded from the count', () => {
    const hull = newHull(2);
    expect(
      hull.isFlightReady([card(CardType.Hull), card(CardType.Equipment), card(CardType.Infrastructure)])
    ).toBe(false);
    expect(hull.isFlightReady([card(CardType.Hull), card(CardType.Hull), card(CardType.Equipment)])).toBe(
      true
    );
  });
});
