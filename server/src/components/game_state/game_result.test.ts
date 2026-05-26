import GameResult from './game_result';

describe('GameResult', () => {
  describe('domination victory', () => {
    let result: GameResult;
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
            colonyCardStack: mockColonyCardStack,
            deck: [],
            discardPile: [],
            cardStacks: []
          },
          {
            no: 1,
            name: 'Player2',
            colonyCardStack: mockColonyCardStack,
            deck: [],
            discardPile: [],
            cardStacks: []
          }
        ]
      };
      result = new GameResult(mockMatch as any);
    });

    test('should set the opponent of the dominated player as winner', () => {
      jest.spyOn(result, 'applyEarnings' as any).mockImplementation(() => 100);

      result.setWinnerByDomination(mockMatch.players[1]);

      expect(result.gameOver).toBe(true);
      expect(result.winnerNo).toBe(0);
      expect(result.type).toBe('domination');
    });

    test('should flip winner when the other player is dominated', () => {
      jest.spyOn(result, 'applyEarnings' as any).mockImplementation(() => 100);

      result.setWinnerByDomination(mockMatch.players[0]);

      expect(result.winnerNo).toBe(1);
      expect(result.type).toBe('domination');
    });
  });
});
