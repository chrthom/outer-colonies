import CardStack from './card_stack';
import Card from './card';
import { ClientCard, ClientCardStack } from '@shared/interfaces/client_state';
import { EventType, MsgTypeInbound, Zone } from '@shared/config/enums';
import { constants } from '@shared/config/constants';
import { designConfig } from '../../config/design';
import { layoutConfig } from '../../config/layout';
import { animationConfig } from '../../config/animation';
import { asGameScene, makeSceneStub } from '../../testing/phaser_stubs';
import { CardXPosition, CardYPosition } from '../perspective';

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

function makePlaneStub(): any {
  const stub: any = {
    modelPosition: { x: 0, y: 0, z: 0 },
    modelRotation: { x: 0, y: 0, z: 0 },
    angle: 0
  };
  [
    'setVisible',
    'setInteractive',
    'disableInteractive',
    'setMask',
    'createBitmapMask',
    'setDepth',
    'setTexture',
    'setTint',
    'setAlpha',
    'on',
    'destroy'
  ].forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
  return stub;
}

function makeImageStub(): any {
  const stub: any = {
    modelPosition: { x: 0, y: 0, z: 0 },
    modelRotation: { x: 0, y: 0, z: 0 },
    angle: 0
  };
  [
    'setOrigin',
    'setAlpha',
    'setDepth',
    'setInteractive',
    'setTint',
    'setPosition',
    'on',
    'off',
    'destroy'
  ].forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
  return stub;
}

function makeScene(): any {
  const scene: any = {
    getPlayerState: jasmine.createSpy('getPlayerState').and.returnValue({ discardPileIds: [] }),
    getPlayerUI: jasmine.createSpy('getPlayerUI').and.returnValue({ hand: [] }),
    getCardMovementEvent: jasmine.createSpy('getCardMovementEvent'),
    retractCardsExist: false,
    activeCards: {},
    isAttackAnimating: false,
    socket: { emit: jasmine.createSpy('emit') },
    time: { delayedCall: jasmine.createSpy('delayedCall') },
    add: jasmine.createSpyObj('add', ['image', 'text', 'plane']),
    tweens: jasmine.createSpyObj('tweens', ['add']),
    children: jasmine.createSpyObj('children', ['bringToTop'])
  };
  scene.add.image.and.callFake(makeImageStub);
  scene.add.plane.and.callFake(makePlaneStub);
  scene.tweens.add.and.callFake(() => ({ stop: jasmine.createSpy('tween.stop') }));
  return scene;
}

// Real Card objects created via makeCardStack() need the plane stubs with
// modelPosition, so this factory must use the local makeScene() and not the
// shared scene stub.
function makeCardStack(over: Partial<ClientCardStack> = {}): CardStack {
  return new CardStack(makeScene(), makeData(over));
}

function seedSummaryBox(cs: CardStack) {
  (cs as any).summaryBox = { update: jasmine.createSpy('summaryBox.update') };
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

  describe('update', () => {
    const cardData = (uuid: string, id: number, index = 0) => ({
      uuid,
      id,
      index,
      battleReady: false,
      retractable: false,
      insufficientEnergy: false
    });

    function makeCard(uuid: string, id: number, ownedByPlayer = true): any {
      return {
        data: { uuid, index: 0 },
        cardId: id,
        ownedByPlayer,
        update: jasmine.createSpy('update'),
        discard: jasmine.createSpy('discard'),
        destroyRetractButton: jasmine.createSpy('destroyRetractButton'),
        destroy: jasmine.createSpy('destroy'),
        setDepth: jasmine.createSpy('setDepth'),
        bringPlanesToTop: jasmine.createSpy('bringPlanesToTop'),
        tween: jasmine.createSpy('tween'),
        shortestAngle: jasmine.createSpy('shortestAngle').and.returnValue(0)
      };
    }

    it('reuses existing card objects keyed by uuid instead of recreating them', () => {
      const cs = makeCardStack();
      const cardA = makeCard('a', 1);
      const cardB = makeCard('b', 2);
      cs.cards = [cardA, cardB] as any;
      seedSummaryBox(cs);
      const dataA = cardData('a', 1);
      const dataB = cardData('b', 2);

      cs.update(makeData({ cards: [dataA, dataB] }));

      expect(cardA.update).toHaveBeenCalledWith(dataA, jasmine.any(Number), jasmine.any(Number));
      expect(cardB.update).toHaveBeenCalledWith(dataB, jasmine.any(Number), jasmine.any(Number));
      expect(cs.cards.length).toBe(2);
      expect(cs.cards[0]).toBe(cardA);
      expect(cs.cards[1]).toBe(cardB);
      expect(cardA.destroy).not.toHaveBeenCalled();
      expect(cardB.destroy).not.toHaveBeenCalled();
      expect(cardA.discard).not.toHaveBeenCalled();
      expect(cardB.discard).not.toHaveBeenCalled();
    });

    it('does not schedule delayed destroys (no replaced-card duplicates)', () => {
      const scene = makeScene();
      const cs = new CardStack(scene, makeData());
      cs.cards = [makeCard('a', 1)] as any;
      seedSummaryBox(cs);

      cs.update(makeData({ cards: [cardData('a', 1)] }));

      expect(scene.time.delayedCall).not.toHaveBeenCalled();
    });

    it('animates removed cards to the deck when the server reports a retract event', () => {
      const scene = makeScene();
      scene.getCardMovementEvent.and.callFake((uuid: string) =>
        uuid == 'a' ? { type: EventType.Retract, playerEvent: true, oldUUID: 'a' } : undefined
      );
      const cs = new CardStack(scene, makeData());
      const cardA = makeCard('a', 1);
      const cardB = makeCard('b', 2);
      cs.cards = [cardA, cardB] as any;
      seedSummaryBox(cs);

      cs.update(makeData({ cards: [cardData('b', 2)] }));

      expect(cardA.destroyRetractButton).toHaveBeenCalled();
      expect(cardA.discard).toHaveBeenCalledWith(true, true);
      expect(scene.retractCardsExist).toBeTrue();
      expect(cardB.discard).not.toHaveBeenCalled();
      expect(cs.cards.length).toBe(1);
      expect(cs.cards[0]).toBe(cardB);
    });

    it('animates removed cards to the discard pile of the event owner, even on an opponent stack', () => {
      const scene = makeScene();
      scene.getCardMovementEvent.and.returnValue({
        type: EventType.Discard,
        playerEvent: true,
        oldUUID: 'a'
      });
      const cs = new CardStack(scene, makeData({ ownedByPlayer: false }));
      const cardA = makeCard('a', 442, false);
      cs.cards = [cardA] as any;
      seedSummaryBox(cs);

      cs.update(makeData({ ownedByPlayer: false, cards: [] }));

      expect(cardA.discard).toHaveBeenCalledWith(false, true);
      expect(scene.retractCardsExist).toBeFalse();
    });

    it('matches duplicate card ids deterministically by uuid', () => {
      const cs = makeCardStack();
      const cardA = makeCard('a', 42);
      const cardB = makeCard('b', 42);
      cs.cards = [cardA, cardB] as any;
      seedSummaryBox(cs);

      cs.update(makeData({ cards: [cardData('b', 42)] }));

      expect(cardA.discard).toHaveBeenCalled();
      expect(cardB.update).toHaveBeenCalled();
      expect(cs.cards.length).toBe(1);
      expect(cs.cards[0]).toBe(cardB);
    });

    it('creates card objects only for cards with new uuids', () => {
      const scene = makeScene();
      const cs = new CardStack(scene, makeData());
      const cardA = makeCard('a', 1);
      cs.cards = [cardA] as any;
      seedSummaryBox(cs);
      const dataNew = cardData('new', 7);

      cs.update(makeData({ cards: [cardData('a', 1), dataNew] }));

      expect(scene.add.plane).toHaveBeenCalledTimes(4); // pile, glow, mask and image planes
      expect(cs.cards.length).toBe(2);
      expect(cs.cards[0]).toBe(cardA);
      expect(cs.cards[1].data).toBe(dataNew);
    });

    it('places new cards at the position of the hand card with the same uuid', () => {
      const scene = makeScene();
      scene.getPlayerUI.and.returnValue({
        hand: [{ uuid: 'new', x: { value3d: 111 }, y: { value3d: 222 }, image: { angle: 30 } }]
      });
      const cs = new CardStack(scene, makeData());
      cs.cards = [] as any;
      seedSummaryBox(cs);

      cs.update(makeData({ cards: [cardData('new', 7)] }));

      const newCard = cs.cards[0] as any;
      expect(newCard.image.modelPosition.x).toBe(111);
      expect(newCard.image.modelPosition.y).toBe(222);
    });

    it('places new cards at the deck position when no hand card matches', () => {
      const cs = makeCardStack();
      cs.cards = [] as any;
      seedSummaryBox(cs);

      cs.update(makeData({ cards: [cardData('new', 7)] }));

      const newCard = cs.cards[0] as any;
      expect(newCard.image.modelPosition.x).toBe(newCard.placementConfig.deck.x.value3d);
      expect(newCard.image.modelPosition.y).toBe(newCard.placementConfig.deck.y.value3d);
    });

    it('updates the summary box in place instead of recreating it', () => {
      const cs = makeCardStack();
      cs.cards = [] as any;
      const summaryBox = { update: jasmine.createSpy('summaryBox.update') };
      (cs as any).summaryBox = summaryBox;

      cs.update(makeData({ cards: [] }));

      expect(summaryBox.update).toHaveBeenCalled();
      expect((cs as any).summaryBox).toBe(summaryBox);
    });

    it('creates the summary box if it does not exist yet', () => {
      const cs = makeCardStack();
      cs.cards = [] as any;

      cs.update(makeData({ cards: [] }));

      expect((cs as any).summaryBox).toBeDefined();
    });
  });

  describe('discard', () => {
    function makeFakeCard(uuid: string, ownedByPlayer = true): any {
      return {
        data: { uuid },
        ownedByPlayer,
        discard: jasmine.createSpy('discard'),
        destroyRetractButton: jasmine.createSpy('destroyRetractButton')
      };
    }

    it('animates each card to the destination and owner reported by its movement event', () => {
      const scene = makeScene();
      scene.getCardMovementEvent.and.callFake((uuid: string) => {
        if (uuid == 'u-retracted') return { type: EventType.Retract, playerEvent: false, oldUUID: uuid };
        if (uuid == 'u-caster-tactic') return { type: EventType.Discard, playerEvent: true, oldUUID: uuid };
        return undefined;
      });
      const cs = new CardStack(scene, makeData({ ownedByPlayer: false }));
      const retractedCard = makeFakeCard('u-retracted', false);
      const casterTactic = makeFakeCard('u-caster-tactic', false);
      (cs as any).cards = [retractedCard, casterTactic];

      cs.discard();

      expect(scene.retractCardsExist).toBeTrue();
      expect(retractedCard.discard).toHaveBeenCalledWith(true, false);
      expect(casterTactic.discard).toHaveBeenCalledWith(false, true);
    });

    it('destroys the indicators of the stack before animating the cards away', () => {
      const cs = makeCardStack();
      const card = makeFakeCard('u-1', true);
      (cs as any).cards = [card];
      const summaryBox = { destroy: jasmine.createSpy('destroy') };
      (cs as any).summaryBox = summaryBox;

      cs.discard();

      expect(summaryBox.destroy).toHaveBeenCalled();
      expect(card.destroyRetractButton).toHaveBeenCalled();
      expect(card.discard).toHaveBeenCalledWith(false, true);
    });

    it('ignores subsequent pointerout and pointerover events so un-expand does not collide with retract', () => {
      const scene = makeScene();
      scene.getCardMovementEvent.and.returnValue({ type: EventType.Retract, playerEvent: true });
      const cs = new CardStack(scene, makeData());
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

      cs.discard();
      const stackHandlers = cs as unknown as { pointerout: () => void; pointerover: () => void };
      stackHandlers.pointerout();
      stackHandlers.pointerover();

      expect(card1.discard).toHaveBeenCalledWith(true, true);
      expect(card2.discard).toHaveBeenCalledWith(true, true);
      expect(card1.tween).not.toHaveBeenCalled();
      expect(card2.tween).not.toHaveBeenCalled();
      expect(summaryBox.toDefaultAlpha).not.toHaveBeenCalled();
      expect(summaryBox.highlight).not.toHaveBeenCalled();
    });
  });

  describe('update with real Card objects (retract button sync)', () => {
    const realCardData = (uuid: string, retractable: boolean, insufficientEnergy: boolean) => ({
      uuid,
      id: 1,
      index: 0,
      battleReady: false,
      retractable,
      insufficientEnergy
    });

    function makeRealCard(scene: any, data: ClientCard): Card {
      return new Card(scene, new CardXPosition(0), new CardYPosition(0), false, 'stack-uuid', data);
    }

    function pointerdownHandler(image: any): (pointer: any) => void {
      return image.on.calls
        .allArgs()
        .filter((args: any[]) => args[0] == 'pointerdown')
        .pop()![1];
    }

    it('creates a visible, interactive retract button when a kept card becomes retractable and critical', () => {
      const scene = makeScene();
      const cs = new CardStack(scene, makeData());
      const card = makeRealCard(scene, realCardData('a', false, false));
      cs.cards = [card];
      seedSummaryBox(cs);
      const newData = realCardData('a', true, true);

      cs.update(makeData({ cards: [newData] }));

      expect(cs.cards[0]).toBe(card);
      expect(card.data).toBe(newData);
      expect(card.retractCardButton).toBeDefined();
      const button: any = card.retractCardButton;
      expect(button.image.setAlpha).toHaveBeenCalledWith(designConfig.alpha.normal); // visible
      expect(button.image.on).toHaveBeenCalledWith('pointerdown', jasmine.any(Function)); // interactive
      pointerdownHandler(button.image)({ leftButtonDown: () => true });
      expect(scene.socket.emit).toHaveBeenCalledWith(MsgTypeInbound.Retract, 'stack-uuid', 'a');
    });

    it('binds input handlers when refresh turns a non-critical button critical', () => {
      // Regression: a button created while the card was not critical was never
      // shown, so refresh() must bind the input handlers when it turns critical.
      const scene = makeScene();
      const cs = new CardStack(scene, makeData());
      const card = makeRealCard(scene, realCardData('a', false, false));
      cs.cards = [card];
      seedSummaryBox(cs);

      cs.update(makeData({ cards: [realCardData('a', true, false)] })); // retractable, not critical
      const button: any = card.retractCardButton;
      expect(button).toBeDefined();
      expect(button.image.setAlpha).toHaveBeenCalledWith(0); // hidden
      button.image.on.calls.reset();

      cs.update(makeData({ cards: [realCardData('a', true, true)] })); // turns critical

      expect(card.retractCardButton).toBe(button); // refreshed, not recreated
      expect(scene.add.image).toHaveBeenCalledTimes(1); // button image created only once
      expect(button.image.setAlpha).toHaveBeenCalledWith(designConfig.alpha.normal);
      expect(button.image.on).toHaveBeenCalledWith('pointerdown', jasmine.any(Function));
      pointerdownHandler(button.image)({ leftButtonDown: () => true });
      expect(scene.socket.emit).toHaveBeenCalledWith(MsgTypeInbound.Retract, 'stack-uuid', 'a');
    });

    it('unbinds the input handlers when refresh turns a critical button non-critical', () => {
      // Regression: the hidden (alpha 0) button stayed interactive with its
      // live handlers, so a click at its position emitted a spurious Retract.
      const scene = makeScene();
      const cs = new CardStack(scene, makeData());
      const card = makeRealCard(scene, realCardData('a', true, true));
      cs.cards = [card];
      seedSummaryBox(cs);
      const button: any = card.retractCardButton;
      expect(button).toBeDefined(); // created critical by the constructor
      button.image.off.calls.reset();
      button.image.on.calls.reset();

      cs.update(makeData({ cards: [realCardData('a', true, false)] })); // no longer critical

      expect(card.retractCardButton).toBe(button); // refreshed, not recreated
      expect(button.image.setAlpha).toHaveBeenCalledWith(0); // hidden
      expect(button.image.off).toHaveBeenCalledWith('pointerover');
      expect(button.image.off).toHaveBeenCalledWith('pointerout');
      expect(button.image.off).toHaveBeenCalledWith('pointerdown');
      expect(button.image.on).not.toHaveBeenCalledWith('pointerdown', jasmine.any(Function));
    });

    it('unbinds the input handlers when hide() makes a non-critical button invisible', () => {
      // Regression: a button shown via pointerover kept its live pointerdown
      // handler while fading to alpha 0.
      const scene = makeScene();
      const card = makeRealCard(scene, realCardData('a', true, false));
      const button: any = card.retractCardButton;
      button.show(
        0,
        0,
        () => {},
        () => {}
      ); // pointerover path: binds handlers
      button.image.off.calls.reset();

      button.hide();

      expect(button.image.off).toHaveBeenCalledWith('pointerover');
      expect(button.image.off).toHaveBeenCalledWith('pointerout');
      expect(button.image.off).toHaveBeenCalledWith('pointerdown');
    });

    it('keeps the input handlers when hide() leaves a critical button visible', () => {
      const scene = makeScene();
      const card = makeRealCard(scene, realCardData('a', true, true));
      const button: any = card.retractCardButton;
      button.image.off.calls.reset();

      button.hide();

      expect(button.image.off).not.toHaveBeenCalled();
      pointerdownHandler(button.image)({ leftButtonDown: () => true });
      expect(scene.socket.emit).toHaveBeenCalledWith(MsgTypeInbound.Retract, 'stack-uuid', 'a');
    });

    it('destroys the retract button when the card is no longer retractable', () => {
      const scene = makeScene();
      const cs = new CardStack(scene, makeData());
      const card = makeRealCard(scene, realCardData('a', false, false));
      cs.cards = [card];
      seedSummaryBox(cs);

      cs.update(makeData({ cards: [realCardData('a', true, false)] }));
      const button: any = card.retractCardButton;
      expect(button).toBeDefined();

      cs.update(makeData({ cards: [realCardData('a', false, false)] }));

      expect(button.image.destroy).toHaveBeenCalled();
      expect(card.retractCardButton).toBeUndefined();
      expect(cs.cards[0]).toBe(card); // the card itself is kept
    });

    it('restores data-order rendering when a card is attached to an existing stack', () => {
      // Regression: a newly attached card is appended to the end of the
      // display list and would render above the kept cards. The root hull
      // is last in data.cards (non-hull attachments come first) and must
      // stay topmost, as it was when all cards were recreated per update.
      const scene = makeScene();
      const cs = new CardStack(scene, makeData());
      const hull = makeRealCard(scene, realCardData('hull', false, false));
      cs.cards = [hull];
      seedSummaryBox(cs);

      cs.update(
        makeData({ cards: [realCardData('attachment', false, false), realCardData('hull', false, false)] })
      );

      const attachment = cs.cards[0] as any;
      expect(cs.cards[1]).toBe(hull);
      const planesOf = (card: any) => [card.imagePile, card.imageHighlight, card.imageMask, card.image];
      const broughtPlanes = scene.children.bringToTop.calls.allArgs().map(([plane]: any[]) => plane);
      // planes are brought to top in data order, so the hull ends up topmost
      expect(broughtPlanes).toEqual([...planesOf(attachment), ...planesOf(hull)]);
    });

    it('stops tweens still running on kept cards before re-tweening them', () => {
      // Regression: the kept card's planes are reused, so a tween from a
      // previous update or hover expand/collapse kept writing alongside the
      // new one.
      const scene = makeScene();
      const createdTweens: Array<{ stop: jasmine.Spy }> = [];
      scene.tweens.add.and.callFake(() => {
        const tween = { stop: jasmine.createSpy('tween.stop') };
        createdTweens.push(tween);
        return tween;
      });
      const cs = new CardStack(scene, makeData());
      const card = makeRealCard(scene, realCardData('a', false, false));
      cs.cards = [card];
      seedSummaryBox(cs);

      cs.update(makeData({ cards: [realCardData('a', false, false)] }));
      const [priorRotationTween, priorPositionTween] = createdTweens;

      cs.update(makeData({ cards: [realCardData('a', false, false)] }));

      expect(priorRotationTween.stop).toHaveBeenCalledTimes(1);
      expect(priorPositionTween.stop).toHaveBeenCalledTimes(1);
    });

    it('tweens a kept button to the new card position instead of snapping it', () => {
      // Regression: refresh() teleported the button to the card's target
      // position while the card itself tweens there, so a visible button
      // floated detached from its card for the whole move animation.
      const scene = makeScene();
      const cs = new CardStack(scene, makeData());
      const card = makeRealCard(scene, realCardData('a', true, false));
      cs.cards = [card];
      seedSummaryBox(cs);
      const button: any = card.retractCardButton;
      button.image.setPosition.calls.reset();
      scene.tweens.add.calls.reset();

      cs.update(makeData({ cards: [realCardData('a', true, false)] }));

      expect(button.image.setPosition).not.toHaveBeenCalled();
      const moveTween = scene.tweens.add.calls
        .allArgs()
        .map(([config]: any[]) => config)
        .find(
          (config: any) =>
            config.targets === button.image && config.duration === animationConfig.duration.move
        );
      expect(moveTween).toBeDefined();
      expect(moveTween.ease).toBe('Cubic.easeInOut'); // in sync with the card's move tween
      expect(moveTween.x).toBe(cs.targetX.value2d + layoutConfig.game.cards.retractCardButton.xOffset);
      expect(moveTween.y).toBe(cs.targetY(0).value2d + layoutConfig.game.cards.retractCardButton.yOffset);
    });
  });

  describe('update with real Card objects (hover state)', () => {
    const stackCard = (uuid: string) => ({
      uuid,
      id: 1,
      index: 0,
      battleReady: false,
      retractable: true,
      insufficientEnergy: false
    });

    function handlerOf(image: any, event: string): () => void {
      return image.on.calls
        .allArgs()
        .filter((args: any[]) => args[0] == event)
        .pop()![1];
    }

    function makeHoveredStack(): { cs: CardStack; scene: any; highlight: jasmine.Spy } {
      const scene = makeScene();
      const cs = new CardStack(scene, makeData({ cards: [stackCard('a'), stackCard('b')] }));
      cs.init();
      spyOn(cs.summaryBox, 'update');
      const highlight = spyOn(cs.summaryBox, 'highlight');
      return { cs, scene, highlight };
    }

    it('re-applies the hover state after an update while the pointer rests on the stack', () => {
      // Regression: the reused card planes never get a new pointerover from
      // Phaser's input poll, so the stack stayed collapsed after a state
      // update until the pointer fully exited and re-entered a card.
      const { cs, highlight } = makeHoveredStack();
      const imageA = (cs.cards[0] as any).image;
      const buttonA: any = (cs.cards[0] as any).retractCardButton;
      const buttonB: any = (cs.cards[1] as any).retractCardButton;
      spyOn(buttonA, 'show');
      spyOn(buttonB, 'show');
      handlerOf(imageA, 'pointerover')(); // pointer rests on the stack
      buttonA.show.calls.reset();
      buttonB.show.calls.reset();
      imageA.setDepth.calls.reset();
      highlight.calls.reset();

      cs.update(makeData({ cards: [stackCard('a'), stackCard('b')] }));

      expect(buttonA.show).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.any(Function),
        jasmine.any(Function)
      );
      expect(buttonB.show).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.any(Function),
        jasmine.any(Function)
      );
      expect(imageA.setDepth).toHaveBeenCalledWith(layoutConfig.depth.cardStackExpanded);
      expect(highlight).toHaveBeenCalled();
    });

    it('does not re-apply the hover state when the stack is not hovered', () => {
      const { cs, highlight } = makeHoveredStack();
      const imageA = (cs.cards[0] as any).image;
      const buttonA: any = (cs.cards[0] as any).retractCardButton;
      spyOn(buttonA, 'show');

      cs.update(makeData({ cards: [stackCard('a'), stackCard('b')] }));

      expect(buttonA.show).not.toHaveBeenCalled();
      expect(highlight).not.toHaveBeenCalled();
      expect(imageA.setDepth).not.toHaveBeenCalledWith(layoutConfig.depth.cardStackExpanded);
    });

    it('does not re-apply the hover state after the pointer left the stack', () => {
      const { cs, highlight } = makeHoveredStack();
      const imageA = (cs.cards[0] as any).image;
      const buttonA: any = (cs.cards[0] as any).retractCardButton;
      spyOn(buttonA, 'show');
      handlerOf(imageA, 'pointerover')(); // pointer enters the stack
      handlerOf(imageA, 'pointerout')(); // ... and leaves it again
      buttonA.show.calls.reset();
      imageA.setDepth.calls.reset();
      highlight.calls.reset();

      cs.update(makeData({ cards: [stackCard('a'), stackCard('b')] }));

      expect(buttonA.show).not.toHaveBeenCalled();
      expect(highlight).not.toHaveBeenCalled();
      expect(imageA.setDepth).not.toHaveBeenCalledWith(layoutConfig.depth.cardStackExpanded);
    });

    it('clears the hover state when a card is removed from a hovered stack so it un-expands cleanly', () => {
      const { cs, scene, highlight } = makeHoveredStack();
      scene.getCardMovementEvent.and.callFake((uuid: string) =>
        uuid == 'a' ? { type: EventType.Retract, playerEvent: true, oldUUID: 'a' } : undefined
      );
      const imageA = (cs.cards[0] as any).image;
      const imageB = (cs.cards[1] as any).image;
      const buttonB: any = (cs.cards[1] as any).retractCardButton;
      spyOn(buttonB, 'show');
      handlerOf(imageA, 'pointerover')(); // stack is hovered when the user clicks Retract on 'a'
      buttonB.show.calls.reset();
      imageB.setDepth.calls.reset();
      highlight.calls.reset();

      cs.update(makeData({ cards: [stackCard('b')] }));

      expect(scene.retractCardsExist).toBeTrue();
      expect(imageA.disableInteractive).toHaveBeenCalledWith(true);
      expect(buttonB.show).not.toHaveBeenCalled();
      expect(highlight).not.toHaveBeenCalled();
      expect(imageB.setDepth).not.toHaveBeenCalledWith(layoutConfig.depth.cardStackExpanded);
    });
  });
});
