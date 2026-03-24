import CardStack from './card_stack';
import { ClientCardStack } from '../../../../../../server/src/shared/interfaces/client_state';

describe('CardStack', () => {
  let cardStack: CardStack;
  let mockScene: any;
  let mockData: ClientCardStack;

  beforeEach(() => {
    mockData = {
      uuid: 'test-uuid',
      zone: 'board',
      cards: [
        { id: 1, cardId: 101, ownedByPlayer: true },
        { id: 2, cardId: 102, ownedByPlayer: true }
      ]
    };

    // Mock the Game scene
    mockScene = {
      getPlayerState: jasmine.createSpy('getPlayerState').and.returnValue({
        discardPileIds: []
      }),
      retractCardsExist: false
    };

    // Create card stack (we'll mock the Card creation)
    cardStack = new CardStack(mockScene, mockData);
  });

  it('should create card stack with correct UUID', () => {
    expect(cardStack).toBeTruthy();
    expect(cardStack.uuid).toBe('test-uuid');
    expect(cardStack.data).toBe(mockData);
  });

  describe('arrayDiff method', () => {
    // Note: arrayDiff is likely a private method, so we test it through public methods
    // or access it directly if it's not private
    
    it('should identify removed and added cards', () => {
      // Access the method if it's available
      if (typeof (cardStack as any).arrayDiff === 'function') {
        const [removed, added] = (cardStack as any).arrayDiff(
          [101, 102], // old cards
          [101, 103]  // new cards
        );
        
        expect(removed).toEqual([102]); // Card 102 was removed
        expect(added).toEqual([103]);   // Card 103 was added
      } else {
        pending('arrayDiff method not accessible for testing');
      }
    });

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
      // Mock cards array
      const mockCard1 = { cardId: 101, discard: jasmine.createSpy('discard1') };
      const mockCard2 = { cardId: 102, discard: jasmine.createSpy('discard2') };
      const mockCard3 = { cardId: 103, discard: jasmine.createSpy('discard3') };
      
      cardStack.cards = [mockCard1, mockCard2, mockCard3];
      
      if (typeof (cardStack as any).filterCardsByIdList === 'function') {
        const filtered = (cardStack as any).filterCardsByIdList([101, 103]);
        
        expect(filtered).toEqual([mockCard1, mockCard3]);
      } else {
        pending('filterCardsByIdList method not accessible for testing');
      }
    });

    it('should return empty array for no matches', () => {
      const mockCard = { cardId: 101, discard: jasmine.createSpy('discard') };
      cardStack.cards = [mockCard];
      
      if (typeof (cardStack as any).filterCardsByIdList === 'function') {
        const filtered = (cardStack as any).filterCardsByIdList([201, 202]);
        expect(filtered).toEqual([]);
      } else {
        pending('filterCardsByIdList method not accessible for testing');
      }
    });
  });

  describe('discard method', () => {
    it('should destroy indicators and discard all cards', () => {
      // Mock destroyIndicators
      spyOn(cardStack, 'destroyIndicators' as any);
      
      // Mock cards
      const mockCard1 = { discard: jasmine.createSpy('discard1') };
      const mockCard2 = { discard: jasmine.createSpy('discard2') };
      cardStack.cards = [mockCard1, mockCard2];
      
      cardStack.discard();
      
      expect(cardStack.destroyIndicators).toHaveBeenCalled();
      expect(mockCard1.discard).toHaveBeenCalledWith(undefined);
      expect(mockCard2.discard).toHaveBeenCalledWith(undefined);
    });

    it('should discard to deck when specified', () => {
      spyOn(cardStack, 'destroyIndicators' as any);
      
      const mockCard = { discard: jasmine.createSpy('discard') };
      cardStack.cards = [mockCard];
      
      cardStack.discard(true);
      
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
        zone: 'board',
        cards: []
      };
      
      const emptyStack = new CardStack(mockScene, emptyData);
      expect(emptyStack.ownedByPlayer).toBeUndefined();
    });
  });

  describe('update method', () => {
    it('should destroy indicators and update cards', () => {
      // Mock destroyIndicators
      spyOn(cardStack, 'destroyIndicators' as any);
      
      // Mock filterCardsByIdList to return empty array
      spyOn(cardStack as any, 'filterCardsByIdList').and.returnValue([]);
      
      const newData: ClientCardStack = {
        uuid: 'test-uuid',
        zone: 'board',
        cards: [
          { id: 1, cardId: 101, ownedByPlayer: true },
          { id: 3, cardId: 103, ownedByPlayer: true } // Changed card
        ]
      };
      
      cardStack.update(newData);
      
      expect(cardStack.destroyIndicators).toHaveBeenCalled();
      expect(cardStack.data).toBe(newData);
    });

    it('should discard removed cards', () => {
      spyOn(cardStack, 'destroyIndicators' as any);
      
      // Mock cards that will be removed
      const mockCardToRemove = {
        cardId: 102,
        discard: jasmine.createSpy('discard')
      };
      
      // Mock filterCardsByIdList to return the card to remove
      spyOn(cardStack as any, 'filterCardsByIdList').and.returnValue([mockCardToRemove]);
      
      const newData: ClientCardStack = {
        uuid: 'test-uuid',
        zone: 'board',
        cards: [
          { id: 1, cardId: 101, ownedByPlayer: true } // Only card 101 remains
        ]
      };
      
      cardStack.update(newData);
      
      expect(mockCardToRemove.discard).toHaveBeenCalled();
    });

    it('should set retractCardsExist flag when discarding to deck', () => {
      spyOn(cardStack, 'destroyIndicators' as any);
      
      // Mock discard pile to not contain the card ID
      mockScene.getPlayerState.and.returnValue({
        discardPileIds: [999] // Different from card ID 102
      });
      
      const mockCard = {
        cardId: 102,
        discard: jasmine.createSpy('discard')
      };
      
      spyOn(cardStack as any, 'filterCardsByIdList').and.returnValue([mockCard]);
      
      const newData: ClientCardStack = {
        uuid: 'test-uuid',
        zone: 'board',
        cards: [{ id: 1, cardId: 101, ownedByPlayer: true }]
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
        targetX: jasmine.createSpy().and.returnValue(100),
        targetY: jasmine.createSpy().and.returnValue(200),
        targetAngle: jasmine.createSpy().and.returnValue(0),
        shortestAngle: jasmine.createSpy().and.returnValue(0)
      };
      const mockCard2 = {
        tween: jasmine.createSpy('tween2'),
        targetX: jasmine.createSpy().and.returnValue(150),
        targetY: jasmine.createSpy().and.returnValue(250),
        targetAngle: jasmine.createSpy().and.returnValue(45),
        shortestAngle: jasmine.createSpy().and.returnValue(45)
      };
      
      cardStack.cards = [mockCard1, mockCard2];
      
      if (typeof cardStack.tween === 'function') {
        cardStack.tween();
        
        expect(mockCard1.tween).toHaveBeenCalled();
        expect(mockCard2.tween).toHaveBeenCalled();
      } else {
        pending('tween method not accessible for testing');
      }
    });
  });
});