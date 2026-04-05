import GameResult from './game_result';

// Mock classes for testing

describe('GameResult', () => {
  let match: any;

  beforeEach(() => {
    match = {};
  });

  describe('constructor and basic properties', () => {
    test('should create game result with match', () => {
      const result = new GameResult(match);

      expect(result).toBeDefined();
      expect(result.match).toBe(match);
    });

    test('should initialize with default values', () => {
      const result = new GameResult(match as any);

      expect(result.winnerNo).toBeUndefined();
    });
  });

  describe('win/loss determination', () => {
    test('should determine winner when one player wins', () => {
      const result = new GameResult(match as any);

      // Simulate player1 winning by setting winnerNo
      result.winnerNo = 1; // player1's number
      result.gameOver = true;

      expect(result.winnerNo).toBe(1);
      expect(result.gameOver).toBe(true);
    });

    test('should handle game result state', () => {
      const result = new GameResult(match as any);

      // Initial state
      expect(result.gameOver).toBe(false);
      expect(result.winnerNo).toBeUndefined();

      // Set game over
      result.gameOver = true;
      result.winnerNo = 2; // player2's number

      expect(result.gameOver).toBe(true);
      expect(result.winnerNo).toBe(2);
    });
  });

  describe('match association', () => {
    test('should be associated with a match', () => {
      const result = new GameResult(match as any);

      expect(result.match).toBe(match);
    });

    test('should maintain match reference', () => {
      const result = new GameResult(match as any);
      const originalMatch = result.match;

      expect(result.match).toBe(originalMatch);
    });
  });

  describe('result state management', () => {
    test('should allow result state to be updated', () => {
      const result = new GameResult(match as any);

      // Initial state
      expect(result.winnerNo).toBeUndefined();
      expect(result.gameOver).toBe(false);

      // Update to player2 win
      result.winnerNo = 2;
      result.gameOver = true;

      expect(result.winnerNo).toBe(2);
      expect(result.gameOver).toBe(true);
    });

    test('should allow result reset', () => {
      const result = new GameResult(match as any);

      // Set some state
      result.winnerNo = 1;
      result.gameOver = true;

      // Reset
      result.winnerNo = undefined;
      result.gameOver = false;

      expect(result.winnerNo).toBeUndefined();
      expect(result.gameOver).toBe(false);
    });
  });

  describe('result validation', () => {
    test('should have valid match reference', () => {
      const result = new GameResult(match as any);

      expect(result.match).toBeDefined();
    });

    test('should handle result consistency', () => {
      const result = new GameResult(match as any);

      // Test game result state transitions
      result.winnerNo = 1;
      result.gameOver = true;

      expect(result.winnerNo).toBe(1);
      expect(result.gameOver).toBe(true);

      // Reset to initial state
      result.winnerNo = undefined;
      result.gameOver = false;

      expect(result.winnerNo).toBeUndefined();
      expect(result.gameOver).toBe(false);
    });
  });

  describe('domination victory', () => {
    let result: GameResult;
    let mockPlayer: any;
    let mockMatch: any;

    beforeEach(() => {
      const mockColonyCardStack = {
        damage: 0,
        profile: { energy: 0 }
      };

      mockMatch = {
        players: [
          {
            no: 0,
            name: 'Player1',
            socketId: 'test-socket-1',
            ready: false,
            deck: [],
            discardPile: [],
            hand: [],
            cardStacks: [],
            colonyCardStack: mockColonyCardStack,
            actionPool: { activate: jest.fn() }
          },
          {
            no: 1,
            name: 'Player2',
            socketId: 'test-socket-2',
            ready: false,
            deck: [],
            discardPile: [],
            hand: [],
            cardStacks: [],
            colonyCardStack: mockColonyCardStack,
            actionPool: { activate: jest.fn() }
          }
        ]
      };
      result = new GameResult(mockMatch as any);
      mockPlayer = {
        no: 1,
        name: 'TestPlayer',
        socketId: 'test-socket',
        match: mockMatch,
        ready: false,
        deck: [],
        discardPile: [],
        hand: [],
        cardStacks: [],
        colonyCardStack: mockColonyCardStack,
        actionPool: { activate: jest.fn() }
      };
    });

    test('should set domination victory correctly', () => {
      // Mock applyEarnings to avoid database calls
      const applyEarningsSpy = jest.spyOn(result, 'applyEarnings' as any).mockImplementation(() => 100);

      result.setWinnerByDomination(mockPlayer as any);

      expect(result.gameOver).toBe(true);
      expect(result.winnerNo).toBe(0); // Opponent of player 1
      expect(result.type).toBe('domination');

      applyEarningsSpy.mockRestore();
    });

    test('should calculate winner correctly for domination', () => {
      // Mock applyEarnings to avoid database calls
      const applyEarningsSpy = jest.spyOn(result, 'applyEarnings' as any).mockImplementation(() => 100);

      const player1 = {
        no: 0,
        name: 'Player1',
        socketId: 'test-socket-1',
        match: mockMatch,
        ready: false,
        deck: [],
        discardPile: [],
        hand: [],
        cardStacks: [],
        colonyCardStack: { damage: 0, profile: { energy: 0 } },
        actionPool: { activate: jest.fn() }
      };
      const player2 = {
        no: 1,
        name: 'Player2',
        socketId: 'test-socket-2',
        match: mockMatch,
        ready: false,
        deck: [],
        discardPile: [],
        hand: [],
        cardStacks: [],
        colonyCardStack: { damage: 0, profile: { energy: 0 } },
        actionPool: { activate: jest.fn() }
      };

      // Player 1 dominates
      result.setWinnerByDomination(player2 as any);
      expect(result.winnerNo).toBe(0);

      // Reset for next test
      result.gameOver = false;
      result.winnerNo = undefined;
      result.type = undefined;

      // Player 2 dominates
      result.setWinnerByDomination(player1 as any);
      expect(result.winnerNo).toBe(1);

      applyEarningsSpy.mockRestore();
    });
  });
});
