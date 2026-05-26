import CardStack from './card_stack';
import { ClientCardStack } from '../../../../../server/src/shared/interfaces/client_state';
import { Zone } from '../../../../../server/src/shared/config/enums';
import { constants } from '../../../../../server/src/shared/config/constants';

function makeData(over: Partial<ClientCardStack> = {}): ClientCardStack {
  return {
    uuid: 'test-uuid',
    zone: Zone.Colony,
    cards: [],
    index: 0,
    zoneCardsNum: 1,
    ownedByPlayer: true,
    missionReady: false,
    interceptionReady: false,
    attributes: [],
    ...over
  };
}

function makeScene(): any {
  return {
    getPlayerState: jasmine.createSpy('getPlayerState').and.returnValue({ discardPileIds: [] }),
    getPlayerUI: jasmine.createSpy('getPlayerUI').and.returnValue({ hand: [] }),
    retractCardsExist: false,
    time: { delayedCall: jasmine.createSpy('delayedCall') },
    add: jasmine.createSpyObj('add', ['image', 'text']),
    tweens: jasmine.createSpyObj('tweens', ['add'])
  };
}

function makeCardStack(over: Partial<ClientCardStack> = {}): CardStack {
  return new CardStack(makeScene(), makeData(over));
}

describe('CardStack', () => {
  describe('constructor', () => {
    it('does not touch the scene (no render side effects)', () => {
      const scene = makeScene();
      const cs = new CardStack(scene, makeData());

      expect(scene.add.image).not.toHaveBeenCalled();
      expect(scene.add.text).not.toHaveBeenCalled();
      expect(scene.tweens.add).not.toHaveBeenCalled();
      // summaryBox is created by init(), not the constructor
      expect(cs.summaryBox).toBeUndefined();
    });

    it('assigns data and uuid from the input ClientCardStack', () => {
      const data = makeData({ uuid: 'abc-123', ownedByPlayer: false });
      const cs = new CardStack(makeScene(), data);

      expect(cs.uuid).toBe('abc-123');
      expect(cs.data).toBe(data);
      expect(cs.ownedByPlayer).toBeFalse();
    });
  });

  describe('ownedByPlayer', () => {
    it('reflects the value in data', () => {
      expect(makeCardStack({ ownedByPlayer: true }).ownedByPlayer).toBeTrue();
      expect(makeCardStack({ ownedByPlayer: false }).ownedByPlayer).toBeFalse();
    });
  });

  describe('isOpponentColony', () => {
    const card = (id: number) => ({
      uuid: `u-${id}`,
      id,
      index: 0,
      battleReady: false,
      retractable: false,
      insufficientEnergy: false
    });

    it('is true only for an opponent stack whose last card is the colony card', () => {
      const cs = makeCardStack();
      cs.data = makeData({ ownedByPlayer: false, cards: [card(1), card(constants.colonyID)] });
      expect(cs.isOpponentColony).toBeTrue();
    });

    it('is false when the stack is owned by the player', () => {
      const cs = makeCardStack();
      cs.data = makeData({ ownedByPlayer: true, cards: [card(constants.colonyID)] });
      expect(cs.isOpponentColony).toBeFalse();
    });

    it('is false when the opponent stack ends with a non-colony card', () => {
      const cs = makeCardStack();
      cs.data = makeData({ ownedByPlayer: false, cards: [card(constants.colonyID), card(42)] });
      expect(cs.isOpponentColony).toBeFalse();
    });

    it('is false when the stack has no cards', () => {
      const cs = makeCardStack();
      cs.data = makeData({ ownedByPlayer: false, cards: [] });
      expect(cs.isOpponentColony).toBeFalse();
    });
  });

  describe('maxIndex', () => {
    const card = (index: number) => ({
      uuid: `u-${index}`,
      id: 1,
      index,
      battleReady: false,
      retractable: false,
      insufficientEnergy: false
    });

    it('returns the highest index across the data.cards array', () => {
      const cs = makeCardStack();
      cs.data = makeData({ cards: [card(0), card(3), card(1)] });
      expect(cs.maxIndex).toBe(3);
    });
  });

  describe('depth', () => {
    function depthOf(zone: Zone, ownedByPlayer: boolean): number {
      const cs = makeCardStack();
      cs.data = makeData({ zone, ownedByPlayer });
      return (cs as any).depth;
    }

    it('orders zones consistently for the player', () => {
      const colony = depthOf(Zone.Colony, true);
      const orbital = depthOf(Zone.Orbital, true);
      const neutral = depthOf(Zone.Neutral, true);

      expect(colony).toBeGreaterThan(orbital);
      expect(orbital).toBeGreaterThan(neutral);
    });

    it('treats the player as more prominent than the opponent in the same zone', () => {
      expect(depthOf(Zone.Colony, true)).toBeGreaterThan(depthOf(Zone.Colony, false));
      expect(depthOf(Zone.Orbital, true)).toBeGreaterThan(depthOf(Zone.Orbital, false));
    });
  });

  describe('arrayDiff (private)', () => {
    function arrayDiff<T>(a: T[], b: T[]): [T[], T[]] {
      return (makeCardStack() as any).arrayDiff(a, b);
    }

    it('returns the inputs unchanged when nothing overlaps', () => {
      expect(arrayDiff([1, 2], [3, 4])).toEqual([
        [1, 2],
        [3, 4]
      ]);
    });

    it('removes each shared element once from both sides', () => {
      expect(arrayDiff([1, 2, 3, 4], [3, 4, 5, 6])).toEqual([
        [1, 2],
        [5, 6]
      ]);
    });

    it('preserves duplicates when only one occurrence is shared', () => {
      const [left, right] = arrayDiff([1, 1, 2], [1, 3]);
      expect(left).toEqual([1, 2]);
      expect(right).toEqual([3]);
    });

    it('does not mutate the original arrays', () => {
      const a = [1, 2, 3];
      const b = [2, 3, 4];
      arrayDiff(a, b);
      expect(a).toEqual([1, 2, 3]);
      expect(b).toEqual([2, 3, 4]);
    });
  });

  describe('filterCardsByIdList (private)', () => {
    function filter(cardIds: number[], list: number[]): any[] {
      const cs = makeCardStack();
      (cs as any).cards = cardIds.map(id => ({ cardId: id }));
      return (cs as any).filterCardsByIdList(list);
    }

    it('returns the cards whose ids are present in the list', () => {
      const filtered = filter([10, 20, 30], [10, 30]);
      expect(filtered.map(c => c.cardId)).toEqual([10, 30]);
    });

    it('matches each id in the list against at most one card', () => {
      const filtered = filter([10, 10, 10], [10, 10]);
      expect(filtered.length).toBe(2);
      expect(filtered.every(c => c.cardId === 10)).toBeTrue();
    });

    it('returns an empty array when no card id matches', () => {
      expect(filter([10, 20], [99])).toEqual([]);
    });

    it('does not mutate the input list', () => {
      const list = [10, 20];
      filter([10, 20], list);
      expect(list).toEqual([10, 20]);
    });
  });
});
