import CardStack from './card_stack';
import Card from './card';
import { ClientCard, ClientCardStack } from '@shared/interfaces/client_state';
import { EventType, Zone } from '@shared/config/enums';
import { constants } from '@shared/config/constants';
import { asGameScene, makeGameObjectStub, makeSceneStub, SceneStub } from '../../testing/phaser_stubs';

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

function makeCardStack(over: Partial<ClientCardStack> = {}): CardStack {
  return new CardStack(asGameScene(makeSceneStub()), makeData(over));
}

describe('CardStack', () => {
  describe('constructor', () => {
    it('does not touch the scene (no render side effects)', () => {
      const scene = makeSceneStub();
      const cs = new CardStack(asGameScene(scene), makeData());

      expect(scene.add.image).not.toHaveBeenCalled();
      expect(scene.add.text).not.toHaveBeenCalled();
      expect(scene.tweens.add).not.toHaveBeenCalled();
      // summaryBox is created by init(), not the constructor
      expect(cs.summaryBox).toBeUndefined();
    });

    it('assigns data and uuid from the input ClientCardStack', () => {
      const data = makeData({ uuid: 'abc-123', ownedByPlayer: false });
      const cs = new CardStack(asGameScene(makeSceneStub()), data);

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
      return (cs as unknown as { depth: number }).depth;
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
      return (makeCardStack() as unknown as { arrayDiff: <T>(a: T[], b: T[]) => [T[], T[]] }).arrayDiff(a, b);
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
    function filter(cardUUIDs: string[], list: string[]): Array<{ data: { uuid: string } }> {
      const cs = makeCardStack();
      cs.cards = cardUUIDs.map(uuid => ({ data: { uuid } })) as unknown as Array<Card>;
      return (
        cs as unknown as {
          filterCardsByUUIDList: (list: string[]) => Array<{ data: { uuid: string } }>;
        }
      ).filterCardsByUUIDList(list);
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

    it('ignores subsequent pointerout and pointerover events so un-expand does not collide with retract', () => {
      const cs = makeCardStack();
      const card1 = {
        ...makeFakeCard('u-1'),
        data: {
          uuid: 'u-1',
          id: 1,
          index: 0,
          battleReady: false,
          retractable: true,
          insufficientEnergy: false
        },
        setDepth: jasmine.createSpy('setDepth'),
        shortestAngle: jasmine.createSpy('shortestAngle').and.returnValue(0),
        tween: jasmine.createSpy('tween')
      };
      const card2 = {
        ...makeFakeCard('u-2'),
        data: {
          uuid: 'u-2',
          id: 2,
          index: 1,
          battleReady: false,
          retractable: true,
          insufficientEnergy: false
        },
        setDepth: jasmine.createSpy('setDepth'),
        shortestAngle: jasmine.createSpy('shortestAngle').and.returnValue(0),
        tween: jasmine.createSpy('tween')
      };
      (cs as unknown as { cards: unknown[] }).cards = [card1, card2];
      const summaryBox = {
        destroy: jasmine.createSpy('destroy'),
        highlight: jasmine.createSpy('highlight'),
        toDefaultAlpha: jasmine.createSpy('toDefaultAlpha')
      };
      (cs as unknown as { summaryBox: typeof summaryBox }).summaryBox = summaryBox;

      cs.discard(() => true);
      const stackHandlers = cs as unknown as { pointerout: () => void; pointerover: () => void };
      stackHandlers.pointerout();
      stackHandlers.pointerover();

      expect(card1.discard).toHaveBeenCalledWith(true);
      expect(card2.discard).toHaveBeenCalledWith(true);
      expect(card1.tween).not.toHaveBeenCalled();
      expect(card2.tween).not.toHaveBeenCalled();
      expect(summaryBox.toDefaultAlpha).not.toHaveBeenCalled();
      expect(summaryBox.highlight).not.toHaveBeenCalled();
    });
  });

  describe('update(data) on a multi-card stack', () => {
    function makePlaneStub() {
      return Object.assign(makeGameObjectStub(), {
        createBitmapMask: jasmine.createSpy('createBitmapMask').and.returnValue({}),
        modelPosition: { x: 0, y: 0, z: 0 },
        modelRotation: { x: 0, y: 0, z: 0 }
      });
    }

    function makeClientCard(uuid: string, id: number, index: number): ClientCard {
      return {
        uuid,
        id,
        index,
        battleReady: false,
        retractable: true,
        insufficientEnergy: false
      };
    }

    it('animates the retracted attachment to the deck and preserves surviving card transforms for un-expand', () => {
      const equipCard = makeClientCard('u-equip', 20, 0);
      const hullCard = makeClientCard('u-hull', 10, 1);
      const scene: SceneStub & {
        activeCards: { hand?: string; stackUUID?: string };
        isAttackAnimating: boolean;
        getCardMovementEvent: jasmine.Spy;
      } = Object.assign(makeSceneStub(), {
        activeCards: {},
        isAttackAnimating: false,
        getCardMovementEvent: jasmine
          .createSpy('getCardMovementEvent')
          .and.callFake((uuid: string) => (uuid == 'u-equip' ? { type: EventType.Retract } : undefined))
      });
      scene.add.plane.and.callFake(makePlaneStub);
      scene.tweens.add.and.callFake(() => ({ stop: jasmine.createSpy('tween.stop') }));

      const cs = new CardStack(
        asGameScene(scene),
        makeData({ uuid: 'u-hull', zone: Zone.Orbital, cards: [equipCard, hullCard] })
      );
      cs.init();

      // Simulate expanded state on the surviving hull card prior to retracting the attachment
      const [oldEquip, oldHull] = cs.cards;
      oldHull.image.modelPosition.x = 123;
      oldHull.image.modelPosition.y = -45;
      oldHull.image.modelPosition.z = 1.5;
      const expandedHullX = oldHull.x.value3d;
      const expandedHullY = oldHull.y.value3d;

      const updatedHull = makeClientCard('u-hull', 10, 0);
      cs.update(makeData({ uuid: 'u-hull', zone: Zone.Orbital, cards: [updatedHull] }));

      expect(scene.retractCardsExist).toBeTrue();
      expect(
        (oldEquip.image as unknown as { disableInteractive: jasmine.Spy }).disableInteractive
      ).toHaveBeenCalledWith(true);
      expect(cs.cards.length).toBe(1);
      expect(cs.cards[0].x.value3d).toBeCloseTo(expandedHullX, 5);
      expect(cs.cards[0].y.value3d).toBeCloseTo(expandedHullY, 5);
      expect(cs.cards[0].z).toBe(1.5);
    });
  });
});
