import Card from './card';
import { CardType } from '../../shared/config/enums';
import CardStack from './card_stack';

class TestCard extends Card {
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame(): void {}
  onLeaveGame(): void {}
  onStartTurn(): void {}
  onEndTurn(): void {}
}

describe('Card.canDefend', () => {
  test('returns false when all defense values are 0', () => {
    const card = new TestCard(1, 'No Defense', CardType.Equipment, 1, {
      armour: 0,
      shield: 0,
      pointDefense: 0
    });
    expect(card.canDefend).toBe(false);
  });

  test('returns false when defense values are negative', () => {
    const card = new TestCard(2, 'Negative Defense', CardType.Equipment, 1, {
      armour: -1,
      shield: -2,
      pointDefense: -3
    });
    expect(card.canDefend).toBe(false);
  });

  test('returns true when any single defense value is positive', () => {
    const card = new TestCard(3, 'Armour Only', CardType.Hull, 1, {
      armour: 5,
      shield: 0,
      pointDefense: 0
    });
    expect(card.canDefend).toBe(true);
  });

  test('returns true when multiple defense values are positive', () => {
    const card = new TestCard(4, 'Multi Defense', CardType.Infrastructure, 1, {
      armour: 2,
      shield: 3,
      pointDefense: 1
    });
    expect(card.canDefend).toBe(true);
  });
});
