import Battle from './battle';
import CardStack from '../cards/card_stack';
import { AttachmentCardStack, RootCardStack } from '../cards/card_stack';
import Card from '../cards/card';
import Player from './player';
import Match from './match';
import EquipmentCard from '../cards/types/equipment_card';
import { BattleType, CardType, TurnPhase, Zone } from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';
import { Socket } from 'socket.io';

class MockCard extends Card {
  getValidTargets(): CardStack[] {
    return [];
  }

  onEnterGame(): void {}
  onLeaveGame(): void {}
  onStartTurn(): void {}
  onEndTurn(): void {}
}

class MockWeaponCard extends EquipmentCard {
  constructor(id: number, range: number) {
    super(id, `Weapon ${id}`, 1, {}, { range, damage: 1, pointDefense: 0, shield: 0, armour: 0 });
  }
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

const createShip = (player: Player, weaponRanges: number[]): RootCardStack => {
  const ship = new RootCardStack(new MockCard(1, 'Ship', CardType.Hull, 1), Zone.Orbital, player);
  weaponRanges.forEach((range, i) =>
    ship.attach(new AttachmentCardStack(new MockWeaponCard(100 + i, range), ship))
  );
  return ship;
};

const createMatch = (): Match => {
  const socket = (playerNo: number): Socket =>
    ({
      id: `socket-${playerNo}`,
      join: jest.fn(),
      data: {
        user: { username: `Player ${playerNo}` },
        activeDeck: [1, 2, 3, 4].map(i => new MockCard(i, `Deck Card ${i}`, CardType.Hull, 1))
      }
    }) as unknown as Socket;
  return new Match('test-room', socket(0), socket(1));
};

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

  describe('maxWeaponRange', () => {
    test('should return the highest weapon range across both fleets', () => {
      battle.ships[0] = [createShip(player0, [1, 3])];
      battle.ships[1] = [createShip(player1, [2])];

      expect(battle.maxWeaponRange).toBe(3);
    });

    test('should return 1 if no participating ship carries a weapon', () => {
      battle.ships[0] = [createShip(player0, [])];
      battle.ships[1] = [createShip(player1, [])];

      expect(battle.maxWeaponRange).toBe(1);
    });

    test('should return 1 for battles without participating ships', () => {
      battle.ships[0] = [];
      battle.ships[1] = [];

      expect(battle.maxWeaponRange).toBe(1);
    });
  });

  describe('prepareCombatPhase', () => {
    let match: Match;

    const setupRaid = (attackerWeaponRanges: number[], defenderWeaponRanges: number[]): string => {
      match = createMatch();
      match.activePlayerNo = 0;
      match.pendingActionPlayerNo = 1;
      match.battle = new Battle(BattleType.Raid, 0);
      const attackerShip = createShip(match.players[0], attackerWeaponRanges);
      attackerShip.zone = Zone.Neutral;
      match.players[0].cardStacks.push(attackerShip);
      match.battle.ships[0] = [attackerShip];
      const defenderShip = createShip(match.players[1], defenderWeaponRanges);
      match.players[1].cardStacks.push(defenderShip);
      return defenderShip.uuid;
    };

    test('should start the battle at the highest weapon range present in the battle', () => {
      const defenderShipId = setupRaid([2], [1]);

      match.prepareCombatPhase([defenderShipId]);

      expect(match.battle.range).toBe(2);
      expect(match.turnPhase).toBe(TurnPhase.Combat);
      expect(match.pendingActionPlayerNo).toBe(0);
      expect(match.battle.ships[1]).not.toContain(match.players[1].colonyCardStack);
    });

    test('should consider weapons of both fleets for the start range', () => {
      const defenderShipId = setupRaid([], [3]);

      match.prepareCombatPhase([defenderShipId]);

      expect(match.battle.range).toBe(3);
      expect(match.turnPhase).toBe(TurnPhase.Combat);
    });

    test('should start at rules.maxRange for battles involving a range 4 weapon', () => {
      const defenderShipId = setupRaid([rules.maxRange], []);

      match.prepareCombatPhase([defenderShipId]);

      expect(match.battle.range).toBe(rules.maxRange);
      expect(match.turnPhase).toBe(TurnPhase.Combat);
    });

    test('should clamp the start range to rules.maxRange', () => {
      const defenderShipId = setupRaid([rules.maxRange + 1], []);

      match.prepareCombatPhase([defenderShipId]);

      expect(match.battle.range).toBe(rules.maxRange);
    });

    test('should run only the range 1 phase and end the battle without any weapons', () => {
      const defenderShipId = setupRaid([], []);

      match.prepareCombatPhase([defenderShipId]);

      expect(match.battle.type).toBe(BattleType.None);
      expect(match.turnPhase).toBe(TurnPhase.Build);
    });

    test('should push the defending colony card stack into the battle when the range 1 phase begins', () => {
      const defenderShipId = setupRaid([1], []);

      match.prepareCombatPhase([defenderShipId]);

      expect(match.battle.range).toBe(1);
      expect(match.battle.ships[1]).toContain(match.players[1].colonyCardStack);
    });

    test('should auto-resolve a mission battle without interceptors via applyMissionResult', () => {
      match.activePlayerNo = 0;
      match.pendingActionPlayerNo = 1;
      match.battle = new Battle(BattleType.Mission, 0);
      const missionShip = createShip(match.players[0], []);
      missionShip.zone = Zone.Neutral;
      missionShip.card.profile.control = 2;
      match.players[0].cardStacks.push(missionShip);
      match.battle.ships[0] = [missionShip];

      match.prepareCombatPhase([]);

      expect(match.battle.type).toBe(BattleType.None);
      expect(match.turnPhase).toBe(TurnPhase.Build);
      expect(match.control).toBe(2);
    });
  });
});
