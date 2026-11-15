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

  describe('filterCardsByUUIDList (private)', () => {
    function filter(cardUUIDs: string[], list: string[]): any[] {
      const cs = makeCardStack();
      (cs as any).cards = cardUUIDs.map(uuid => ({ data: { uuid } }));
      return (cs as any).filterCardsByUUIDList(list);
    }

    it('returns the cards whose uuids are present in the list', () => {
      const filtered = filter(['u-10', 'u-20', 'u-30'], ['u-10', 'u-30']);
      expect(filtered.map(c => c.data.uuid)).toEqual(['u-10', 'u-30']);
    });

    it('matches each uuid in the list against at most one card', () => {
      const filtered = filter(['u-10', 'u-10', 'u-10'], ['u-10', 'u-10']);
      expect(filtered.length).toBe(2);
      expect(filtered.every(c => c.data.uuid === 'u-10')).toBeTrue();
    });

    it('returns an empty array when no card uuid matches', () => {
      expect(filter(['u-10', 'u-20'], ['u-99'])).toEqual([]);
    });

    it('does not mutate the input list', () => {
      const list = ['u-10', 'u-20'];
      filter(['u-10', 'u-20'], list);
      expect(list).toEqual(['u-10', 'u-20']);
    });
  });

  describe('discard(toDeckFor)', () => {
    function makeFakeCard(uuid: string): any {
      return {
        data: { uuid },
        discard: jasmine.createSpy('discard'),
        destroyRetractButton: jasmine.createSpy('destroyRetractButton')
      };
    }

    it('animates each card to the destination reported by the per-card callback', () => {
      const cs = makeCardStack();
      const retractedCard = makeFakeCard('u-retracted');
      const discardedCard = makeFakeCard('u-discarded');
      (cs as any).cards = [retractedCard, discardedCard];

      cs.discard(card => card.data.uuid == 'u-retracted');

      expect(retractedCard.discard).toHaveBeenCalledWith(true);
      expect(discardedCard.discard).toHaveBeenCalledWith(false);
    });

    it('destroys the indicators of the stack before animating the cards away', () => {
      const cs = makeCardStack();
      const card = makeFakeCard('u-1');
      (cs as any).cards = [card];
      const summaryBox = { destroy: jasmine.createSpy('destroy') };
      (cs as any).summaryBox = summaryBox;

      cs.discard();

      expect(summaryBox.destroy).toHaveBeenCalled();
      expect(card.destroyRetractButton).toHaveBeenCalled();
      expect(card.discard).toHaveBeenCalledWith(undefined);
    });
  });
});
