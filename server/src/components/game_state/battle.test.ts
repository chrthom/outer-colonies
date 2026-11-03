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
  constructor(playerNo: number) {
    const mockMatch = new MockMatch() as any as Match;
    super('test-socket', 'Test Player', mockMatch, playerNo, []);
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
  let player0: MockPlayer;
  let player1: MockPlayer;

  beforeEach(() => {
    player0 = new MockPlayer(0);
    player1 = new MockPlayer(1);
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

    describe('applyMissionResult', () => {
      const createMissionShip = (player: Player, control: number): RootCardStack => {
        const card = new MockCard(1, 'MissionShip', CardType.Hull, 1);
        card.profile.control = control;
        return new RootCardStack(card, Zone.Neutral, player);
      };
      const createInterceptingShip = (player: Player, control: number): RootCardStack => {
        const card = new MockCard(2, 'Interceptor', CardType.Hull, 1);
        card.profile.control = control;
        return new RootCardStack(card, Zone.Neutral, player);
      };
      const mockMatchFor = (activePlayerNo: number, players: Player[]): Match =>
        ({
          activePlayer: players[activePlayerNo],
          activePlayerNo,
          players,
          gameResult: { setWinnerByDeckDepletion: jest.fn() }
        }) as any as Match;
      const stubMissionLoot = (player: Player) => {
        player.gainControl = jest.fn();
        player.drawCards = jest.fn();
        player.pickCardsFromTopOfDiscardPile = jest.fn().mockReturnValue([]);
      };

      test('should grant control surplus to player 0 on successful mission', () => {
        battle = new Battle(BattleType.Mission, 0);
        const mockMatch = mockMatchFor(0, [player0, player1]);
        battle.ships[0] = [createMissionShip(player0, 3)];
        battle.ships[1] = [createInterceptingShip(player1, 2)];
        stubMissionLoot(player0);

        (battle as any).applyMissionResult(mockMatch);

        expect(player0.gainControl).toHaveBeenCalledWith(1);
        expect(player0.drawCards).toHaveBeenCalledWith(1);
      });

      test('should grant control surplus to player 1 on successful mission', () => {
        battle = new Battle(BattleType.Mission, 1);
        const mockMatch = mockMatchFor(1, [player0, player1]);
        battle.ships[1] = [createMissionShip(player1, 3)];
        battle.ships[0] = [createInterceptingShip(player0, 2)];
        stubMissionLoot(player1);

        (battle as any).applyMissionResult(mockMatch);

        expect(player1.gainControl).toHaveBeenCalledWith(1);
        expect(player1.drawCards).toHaveBeenCalledWith(1);
      });

      test('should not grant control on failed mission', () => {
        battle = new Battle(BattleType.Mission, 1);
        const mockMatch = mockMatchFor(1, [player0, player1]);
        battle.ships[1] = [];
        battle.ships[0] = [createInterceptingShip(player0, 2)];
        stubMissionLoot(player1);

        (battle as any).applyMissionResult(mockMatch);

        expect(player1.gainControl).not.toHaveBeenCalled();
        expect(player1.drawCards).not.toHaveBeenCalled();
      });

      test('should fire onMissionCompletion only on active player ships', () => {
        battle = new Battle(BattleType.Mission, 1);
        const mockMatch = mockMatchFor(1, [player0, player1]);
        const missionShip = createMissionShip(player1, 3);
        const interceptingShip = createInterceptingShip(player0, 2);
        battle.ships[1] = [missionShip];
        battle.ships[0] = [interceptingShip];
        stubMissionLoot(player1);
        const missionShipSpy = jest.spyOn(missionShip.card, 'onMissionCompletion');
        const interceptingShipSpy = jest.spyOn(interceptingShip.card, 'onMissionCompletion');

        (battle as any).applyMissionResult(mockMatch);

        expect(missionShipSpy).toHaveBeenCalledTimes(1);
        expect(missionShipSpy).toHaveBeenCalledWith(player1);
        expect(interceptingShipSpy).not.toHaveBeenCalled();
      });
    });
  });
});
