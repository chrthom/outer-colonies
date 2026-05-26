import Battle from './battle';
import CardStack from '../cards/card_stack';
import { RootCardStack } from '../cards/card_stack';
import Card from '../cards/card';
import Player from './player';
import Match from './match';
import { CardType, Zone, BattleType } from '../../shared/config/enums';

class MockCard extends Card {
  getValidTargets(): CardStack[] {
    return [];
  }

  onEnterGame(): void {}
  onLeaveGame(): void {}
  onStartTurn(): void {}
  onEndTurn(): void {}
}

class MockPlayer extends Player {
  constructor() {
    const mockMatch = new MockMatch() as any as Match;
    super('test-socket', 'Test Player', mockMatch, 1, []);
  }
}

class MockMatch {
  room = 'test-room';
  players: Player[] = [];
  battle = new Battle(BattleType.None, 0);
  activePlayerNo = 1;
  inactivePlayerNo = 2;
  pendingActionPlayerNo = 1;
}

describe('Battle', () => {
  let battle: Battle;
  let player1: MockPlayer;
  let player2: MockPlayer;

  beforeEach(() => {
    player1 = new MockPlayer();
    player2 = new MockPlayer();
    battle = new Battle(BattleType.Mission, 1);
  });

  describe('control mechanics', () => {
    test('should sum control values across ships', () => {
      const mockCard1 = new MockCard(1, 'Ship1', CardType.Hull, 1);
      mockCard1.profile.control = 3;
      const mockCard2 = new MockCard(2, 'Ship2', CardType.Hull, 1);
      mockCard2.profile.control = 2;

      const ship1 = new RootCardStack(mockCard1, Zone.Hand, player1);
      const ship2 = new RootCardStack(mockCard2, Zone.Hand, player1);

      battle.ships[0] = [ship1, ship2];
      battle.ships[1] = [];

      const sumControl = (battle as any).sumControl(battle.ships[0]);
      expect(sumControl).toBe(5);
    });

    test('should sum to zero for empty ship arrays', () => {
      battle.ships[0] = [];

      const sumControl = (battle as any).sumControl(battle.ships[0]);
      expect(sumControl).toBe(0);
    });

    test('should grant control surplus on successful mission', () => {
      battle = new Battle(BattleType.Mission, 1);

      const mockGameResult = { setWinnerByDeckDepletion: jest.fn() };
      const mockMatch = {
        activePlayer: player1,
        activePlayerNo: 1,
        players: [player1, player2],
        gameResult: mockGameResult
      } as any as Match;

      const attackerCard = new MockCard(1, 'Ship1', CardType.Hull, 1);
      attackerCard.profile.control = 3;
      const defenderCard = new MockCard(2, 'Ship2', CardType.Hull, 1);
      defenderCard.profile.control = 2;

      battle.ships[0] = [new RootCardStack(attackerCard, Zone.Hand, player1)];
      battle.ships[1] = [new RootCardStack(defenderCard, Zone.Hand, player1)];

      const gainControlSpy = jest.fn();
      const drawCardsSpy = jest.fn();
      player1.gainControl = gainControlSpy;
      player1.drawCards = drawCardsSpy;
      player1.pickCardsFromTopOfDiscardPile = jest.fn().mockReturnValue([]);

      (battle as any).applyMissionResult(mockMatch);

      expect(gainControlSpy).toHaveBeenCalledWith(1);
      expect(drawCardsSpy).toHaveBeenCalledWith(1);
    });
  });
});
