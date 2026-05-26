import Card from '../cards/card';
import CardStack from '../cards/card_stack';
import { Attack } from '../game_state/battle';
import {
  arrayDiff,
  combineAttackResults,
  getCardStackByUUID,
  opponentPlayerNo,
  spliceCardById,
  spliceCardStackByUUID,
  spliceFrom
} from './helpers';

const stack = (uuid: string): CardStack => ({ uuid }) as unknown as CardStack;
const card = (id: number): Card => ({ id }) as unknown as Card;

describe('arrayDiff', () => {
  it('removes each shared element exactly once from both sides', () => {
    const [left, right] = arrayDiff([1, 2, 3, 4], [3, 4, 5, 6]);

    expect(left).toEqual([1, 2]);
    expect(right).toEqual([5, 6]);
  });

  it('removes only one occurrence per shared element (preserves duplicates)', () => {
    const [left, right] = arrayDiff([1, 1, 2], [1, 3]);

    expect(left).toEqual([1, 2]);
    expect(right).toEqual([3]);
  });

  it('returns inputs unchanged when nothing overlaps', () => {
    const [left, right] = arrayDiff([1, 2], [3, 4]);

    expect(left).toEqual([1, 2]);
    expect(right).toEqual([3, 4]);
  });

  it('does not mutate the original arrays', () => {
    const a = [1, 2, 3];
    const b = [2, 3, 4];

    arrayDiff(a, b);

    expect(a).toEqual([1, 2, 3]);
    expect(b).toEqual([2, 3, 4]);
  });
});

describe('opponentPlayerNo', () => {
  it('returns 1 for player 0', () => {
    expect(opponentPlayerNo(0)).toBe(1);
  });

  it('returns 0 for player 1', () => {
    expect(opponentPlayerNo(1)).toBe(0);
  });
});

describe('getCardStackByUUID', () => {
  it('returns the stack whose uuid matches', () => {
    const stacks = [stack('a'), stack('b'), stack('c')];

    expect(getCardStackByUUID(stacks, 'b')).toBe(stacks[1]);
  });

  it('returns undefined when no stack matches', () => {
    expect(getCardStackByUUID([stack('a')], 'missing')).toBeUndefined();
  });
});

describe('spliceFrom', () => {
  it('removes and returns the first matching element', () => {
    const items = [1, 2, 3, 2];

    const result = spliceFrom(items, e => e === 2);

    expect(result).toBe(2);
    expect(items).toEqual([1, 3, 2]);
  });

  it('returns undefined and leaves the array untouched when nothing matches', () => {
    const items = [1, 2, 3];

    const result = spliceFrom(items, e => e === 99);

    expect(result).toBeUndefined();
    expect(items).toEqual([1, 2, 3]);
  });
});

describe('spliceCardStackByUUID', () => {
  it('removes and returns the stack whose uuid matches', () => {
    const stacks = [stack('a'), stack('b'), stack('c')];

    const result = spliceCardStackByUUID(stacks, 'b');

    expect(result?.uuid).toBe('b');
    expect(stacks.map(s => s.uuid)).toEqual(['a', 'c']);
  });

  it('returns undefined when no stack matches', () => {
    const stacks = [stack('a')];

    expect(spliceCardStackByUUID(stacks, 'missing')).toBeUndefined();
    expect(stacks).toHaveLength(1);
  });
});

describe('spliceCardById', () => {
  it('removes and returns the card whose id matches', () => {
    const cards = [card(1), card(2), card(3)];

    const result = spliceCardById(cards, 2);

    expect(result?.id).toBe(2);
    expect(cards.map(c => c.id)).toEqual([1, 3]);
  });

  it('returns undefined when no card matches', () => {
    const cards = [card(1)];

    expect(spliceCardById(cards, 99)).toBeUndefined();
    expect(cards).toHaveLength(1);
  });
});

describe('combineAttackResults', () => {
  const attack = (over: Partial<Attack> = {}): Attack => ({
    sourceRootUUID: 'src-root',
    sourceSubUUID: 'src-sub',
    targetUUID: 'tgt',
    pointDefense: 0,
    shield: 0,
    armour: 0,
    damage: 0,
    ...over
  });

  it('returns the other attack when one side is undefined', () => {
    const a = attack({ damage: 5 });

    expect(combineAttackResults(a, undefined)).toBe(a);
    expect(combineAttackResults(undefined, a)).toBe(a);
  });

  it('returns undefined when both sides are undefined', () => {
    expect(combineAttackResults(undefined, undefined)).toBeUndefined();
  });

  it('sums the numeric defense and damage fields', () => {
    const a = attack({ pointDefense: 1, shield: 2, armour: 3, damage: 4 });
    const b = attack({ pointDefense: 10, shield: 20, armour: 30, damage: 40 });

    expect(combineAttackResults(a, b)).toEqual({
      sourceRootUUID: 'src-root',
      sourceSubUUID: 'src-sub',
      targetUUID: 'tgt',
      pointDefense: 11,
      shield: 22,
      armour: 33,
      damage: 44
    });
  });

  it('keeps the source and target identifiers of the first attack', () => {
    const a = attack({ sourceRootUUID: 'first-root', targetUUID: 'first-tgt' });
    const b = attack({ sourceRootUUID: 'second-root', targetUUID: 'second-tgt' });

    const combined = combineAttackResults(a, b)!;

    expect(combined.sourceRootUUID).toBe('first-root');
    expect(combined.targetUUID).toBe('first-tgt');
  });
});
