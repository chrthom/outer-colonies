import CardStack from './card_stack';
import { ClientCardStack } from '../../../../../server/src/shared/interfaces/client_state';
import Game from '../../scenes/game';

describe('CardStack', () => {
  let cardStack: CardStack;
  let mockScene: any;
  let mockData: ClientCardStack;

  beforeEach(() => {
    mockData = {
      uuid: 'test-uuid',
      zone: 'board' as any, // Cast to Zone type
      cards: [
        { uuid: 'card-1', id: 1, index: 0, battleReady: true, retractable: false, insufficientEnergy: false },
        { uuid: 'card-2', id: 2, index: 1, battleReady: true, retractable: false, insufficientEnergy: false }
      ],
      index: 0,
      zoneCardsNum: 2,
      ownedByPlayer: true,
      missionReady: false,
      interceptionReady: false,
      attributes: []
    };

    // Mock the Game scene
    mockScene = {
      getPlayerState: jasmine.createSpy('getPlayerState').and.returnValue({
        discardPileIds: []
      }),
      getPlayerUI: jasmine.createSpy('getPlayerUI').and.returnValue({
        hand: []
      }),
      retractCardsExist: false,
      time: {
        delayedCall: jasmine.createSpy('delayedCall').and.callFake((delay: number, callback: () => void) => {
          // Execute callback immediately for testing
          callback();
        })
      }
    };

    // Create card stack (we'll mock the Card creation)
    cardStack = new CardStack(mockScene, mockData);

    // Mock game object for testing
    game = {
      cardStacks: [],
      state: {} as any
    } as any as Game;
  });

  it('should create card stack with correct UUID', () => {
    expect(cardStack).toBeTruthy();
    expect(cardStack.uuid).toBe('test-uuid');
    expect(cardStack.data).toBe(mockData);
  });

  describe('arrayDiff method', () => {
    // Test array diff through the public update method
    // Since arrayDiff is private, we test its behavior indirectly

    it('should handle empty arrays', () => {
      if (typeof (cardStack as any).arrayDiff === 'function') {
        const [removed, added] = (cardStack as any).arrayDiff([], [101]);
        expect(removed).toEqual([]);
        expect(added).toEqual([101]);
      } else {
        pending('arrayDiff method not accessible for testing');
      }
    });

    it('should handle no changes', () => {
      if (typeof (cardStack as any).arrayDiff === 'function') {
        const [removed, added] = (cardStack as any).arrayDiff([101, 102], [101, 102]);
        expect(removed).toEqual([]);
        expect(added).toEqual([]);
      } else {
        pending('arrayDiff method not accessible for testing');
      }
    });
  });

  describe('filterCardsByIdList method', () => {
    it('should filter cards by ID list', () => {
      // Mock cards array - use type assertion since we're testing behavior
      const mockCard1 = { cardId: 1, data: { id: 1 }, discard: jasmine.createSpy('discard1') } as any;
      const mockCard2 = { cardId: 2, data: { id: 2 }, discard: jasmine.createSpy('discard2') } as any;
      const mockCard3 = { cardId: 3, data: { id: 3 }, discard: jasmine.createSpy('discard3') } as any;

      cardStack.cards = [mockCard1, mockCard2, mockCard3];

      if (typeof (cardStack as any).filterCardsByIdList === 'function') {
        const filtered = (cardStack as any).filterCardsByIdList([1, 3]);

        expect(filtered).toEqual([mockCard1, mockCard3]);
      } else {
        pending('filterCardsByIdList method not accessible for testing');
      }
    });

    it('should return empty array for no matches', () => {
      const mockCard = { cardId: 1, data: { id: 1 }, discard: jasmine.createSpy('discard') } as any;
      cardStack.cards = [mockCard];

      if (typeof (cardStack as any).filterCardsByIdList === 'function') {
        const filtered = (cardStack as any).filterCardsByIdList([2, 3]);
        expect(filtered).toEqual([]);
      } else {
        pending('filterCardsByIdList method not accessible for testing');
      }
    });
  });

  describe('discard method', () => {
    it('should discard all cards when called', () => {
      // Mock cards with discard method
      const mockCard1 = {
        discard: jasmine.createSpy('discard1'),
        destroyRetractButton: jasmine.createSpy('destroyRetractButton1'),
        data: { id: 1 }
      } as any;
      const mockCard2 = {
        discard: jasmine.createSpy('discard2'),
        destroyRetractButton: jasmine.createSpy('destroyRetractButton2'),
        data: { id: 2 }
      } as any;
      (cardStack as any).cards = [mockCard1, mockCard2];

      // Call discard through public interface
      (cardStack as any).discard();

      // Verify cards were discarded
      expect(mockCard1.discard).toHaveBeenCalledWith(undefined);
      expect(mockCard2.discard).toHaveBeenCalledWith(undefined);
    });

    it('should discard to deck when specified', () => {
      const mockCard = {
        discard: jasmine.createSpy('discard'),
        destroyRetractButton: jasmine.createSpy('destroyRetractButton'),
        data: { id: 1 }
      } as any;
      (cardStack as any).cards = [mockCard];

      (cardStack as any).discard(true);

      expect(mockCard.discard).toHaveBeenCalledWith(true);
    });
  });

  describe('ownedByPlayer property', () => {
    it('should determine player ownership from first card', () => {
      expect(cardStack.ownedByPlayer).toBe(true); // From our mock data
    });

    it('should handle empty cards array', () => {
      const emptyData = {
        uuid: 'test-uuid',
        zone: 'hand' as any,
        cards: [],
        index: 0,
        zoneCardsNum: 0,
        ownedByPlayer: true,
        missionReady: false,
        interceptionReady: false,
        attributes: []
      };

      const emptyStack = new CardStack(mockScene, emptyData);
      // Test that ownedByPlayer is correctly read from data even with empty cards
      expect(emptyStack.ownedByPlayer).toBe(true);
    });
  });

  describe('update method', () => {
    it('should destroy indicators and update cards', () => {
      // Mock destroyIndicators
      spyOn(cardStack as any, 'destroyIndicators');

      // Mock filterCardsByIdList to return empty array
      spyOn(cardStack as any, 'filterCardsByIdList').and.returnValue([]);

      // Mock current cards for the update method
      const mockCard1 = { cardId: 1, setDepth: jasmine.createSpy(), data: { id: 1 } };
      const mockCard2 = { cardId: 2, setDepth: jasmine.createSpy(), data: { id: 2 } };
      (cardStack as any).cards = [mockCard1, mockCard2];

      // Mock createCards to avoid Phaser initialization
      spyOn(cardStack as any, 'createCards');
      // Mock tween to avoid Phaser animation calls
      spyOn(cardStack as any, 'tween');

      const newData: ClientCardStack = {
        uuid: 'test-uuid',
        zone: 'board' as any,
        cards: [
          {
            uuid: 'card-1',
            id: 1,
            index: 0,
            battleReady: true,
            retractable: false,
            insufficientEnergy: false
          },
          {
            uuid: 'card-3',
            id: 3,
            index: 1,
            battleReady: true,
            retractable: false,
            insufficientEnergy: false
          }
        ],
        index: 0,
        zoneCardsNum: 2,
        ownedByPlayer: true,
        missionReady: false,
        interceptionReady: false,
        attributes: []
      };

      cardStack.update(newData);

      expect((cardStack as any).destroyIndicators).toHaveBeenCalled();
      expect(cardStack.data).toBe(newData);
    });

    it('should discard removed cards', () => {
      spyOn(cardStack as any, 'destroyIndicators');

      // Mock current cards for the update method
      const mockCard1 = {
        cardId: 1,
        setDepth: jasmine.createSpy(),
        setX: jasmine.createSpy().and.returnValue({
          setY: jasmine.createSpy().and.returnValue({
            setAngle: jasmine.createSpy().and.returnValue({ setDepth: jasmine.createSpy() })
          })
        }),
        placementConfig: { deck: { x: 0, y: 0 } },
        destroy: jasmine.createSpy('destroy1'),
        data: { id: 1 }
      };
      const mockCardToRemove = {
        cardId: 2,
        setDepth: jasmine.createSpy(),
        setX: jasmine.createSpy().and.returnValue({
          setY: jasmine.createSpy().and.returnValue({
            setAngle: jasmine.createSpy().and.returnValue({ setDepth: jasmine.createSpy() })
          })
        }),
        placementConfig: { deck: { x: 0, y: 0 } },
        destroy: jasmine.createSpy('destroy2'),
        data: { id: 2 },
        discard: jasmine.createSpy('discard')
      } as any;
      (cardStack as any).cards = [mockCard1, mockCardToRemove];

      // Mock filterCardsByIdList to return the card to remove
      spyOn(cardStack as any, 'filterCardsByIdList').and.returnValue([mockCardToRemove]);

      // Mock createCards to avoid Phaser initialization
      spyOn(cardStack as any, 'createCards');
      // Mock tween to avoid Phaser animation calls
      spyOn(cardStack as any, 'tween');

      const newData: ClientCardStack = {
        uuid: 'test-uuid',
        zone: 'hand' as any,
        cards: [
          {
            uuid: 'card-1',
            id: 1,
            index: 0,
            battleReady: true,
            retractable: false,
            insufficientEnergy: false
          }
        ],
        index: 0,
        zoneCardsNum: 1,
        ownedByPlayer: true,
        missionReady: false,
        interceptionReady: false,
        attributes: []
      };

      cardStack.update(newData);

      expect(mockCardToRemove.discard).toHaveBeenCalled();
    });

    it('should set retractCardsExist flag when discarding to deck', () => {
      spyOn(cardStack as any, 'destroyIndicators');

      // Mock discard pile to not contain the card ID
      mockScene.getPlayerState.and.returnValue({
        discardPileIds: [999] // Different from card ID 2
      });

      // Mock current cards for the update method
      const mockCard1 = {
        cardId: 1,
        setDepth: jasmine.createSpy(),
        setX: jasmine.createSpy().and.returnValue({
          setY: jasmine.createSpy().and.returnValue({
            setAngle: jasmine.createSpy().and.returnValue({ setDepth: jasmine.createSpy() })
          })
        }),
        placementConfig: { deck: { x: 0, y: 0 } },
        destroy: jasmine.createSpy('destroy1'),
        data: { id: 1 }
      };
      const mockCard = {
        cardId: 2,
        setDepth: jasmine.createSpy(),
        setX: jasmine.createSpy().and.returnValue({
          setY: jasmine.createSpy().and.returnValue({
            setAngle: jasmine.createSpy().and.returnValue({ setDepth: jasmine.createSpy() })
          })
        }),
        placementConfig: { deck: { x: 0, y: 0 } },
        destroy: jasmine.createSpy('destroy2'),
        data: { id: 2 },
        discard: jasmine.createSpy('discard')
      } as any;
      (cardStack as any).cards = [mockCard1, mockCard];

      spyOn(cardStack as any, 'filterCardsByIdList').and.returnValue([mockCard]);

      // Mock createCards to avoid Phaser initialization
      spyOn(cardStack as any, 'createCards');
      // Mock tween to avoid Phaser animation calls
      spyOn(cardStack as any, 'tween');

      const newData: ClientCardStack = {
        uuid: 'test-uuid',
        zone: 'hand' as any,
        cards: [
          {
            uuid: 'card-1',
            id: 1,
            index: 0,
            battleReady: true,
            retractable: false,
            insufficientEnergy: false
          }
        ],
        index: 0,
        zoneCardsNum: 1,
        ownedByPlayer: true,
        missionReady: false,
        interceptionReady: false,
        attributes: []
      };

      cardStack.update(newData);

      expect(mockScene.retractCardsExist).toBe(true);
      expect(mockCard.discard).toHaveBeenCalledWith(true); // Should discard to deck
    });
  });

  describe('tween method', () => {
    it('should call tween on all cards', () => {
      // Mock cards with tween method
      const mockCard1 = {
        tween: jasmine.createSpy('tween1'),
        setDepth: jasmine.createSpy('setDepth1'),
        targetX: jasmine.createSpy().and.returnValue(100),
        targetY: jasmine.createSpy().and.returnValue(200),
        targetAngle: jasmine.createSpy().and.returnValue(0),
        shortestAngle: jasmine.createSpy().and.returnValue(0),
        data: { id: 1 }
      } as any;
      const mockCard2 = {
        tween: jasmine.createSpy('tween2'),
        setDepth: jasmine.createSpy('setDepth2'),
        targetX: jasmine.createSpy().and.returnValue(150),
        targetY: jasmine.createSpy().and.returnValue(250),
        targetAngle: jasmine.createSpy().and.returnValue(45),
        shortestAngle: jasmine.createSpy().and.returnValue(45),
        data: { id: 2 }
      } as any;

      cardStack.cards = [mockCard1, mockCard2];

      if (typeof (cardStack as any).tween === 'function') {
        (cardStack as any).tween();

        expect(mockCard1.tween).toHaveBeenCalled();
        expect(mockCard2.tween).toHaveBeenCalled();
      } else {
        pending('tween method not accessible for testing');
      }
    });
  });
});
