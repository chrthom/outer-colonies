import Card, { CardRarity } from '../cards/card';
import CardStack, { AttachmentCardStack, RootCardStack } from '../cards/card_stack';
import Match from '../game_state/match';
import Player from '../game_state/player';
import Battle from '../game_state/battle';
import { BattleType, CardType, Zone } from '../../shared/config/enums';
import { Socket } from 'socket.io';
import {
  fleetStrength,
  planBattle,
  selectAttack,
  selectHandCard,
  selectInterceptingShips,
  selectTarget
} from './strategy';

class MockCard extends Card {
  constructor(id: number, name: string, type: CardType, rarity: CardRarity) {
    super(id, name, type, rarity);
  }
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame(): void {}
  onLeaveGame(): void {}
  onStartTurn(): void {}
  onEndTurn(): void {}
}

class MockHullCard extends MockCard {
  constructor(id: number, hp: number, speed: number) {
    super(id, `Hull ${id}`, CardType.Hull, 1);
    this.profile.hp = hp;
    this.profile.speed = speed;
  }
  override isFlightReady(): boolean {
    return true;
  }
}

class MockWeaponCard extends MockCard {
  readonly attackProfile;
  constructor(id: number, damage: number) {
    super(id, `Weapon ${id}`, CardType.Equipment, 1);
    this.attackProfile = { range: 2, damage, pointDefense: 0, shield: 0, armour: 0 };
  }
  override get canAttack(): boolean {
    return true;
  }
  override isInRange(): boolean {
    return true;
  }
}

/** Hand card stack with a controllable playability, independent of match state. */
class PlayableCardStack extends RootCardStack {
  constructor(
    card: Card,
    player: Player,
    private readonly playable: boolean,
    private readonly targets: CardStack[] = []
  ) {
    super(card, Zone.Hand, player);
  }
  override get hasValidTargets(): boolean {
    return this.playable;
  }
  override get validTargets(): CardStack[] {
    return this.targets;
  }
}

const createSocket = (playerNo: number): Socket =>
  ({
    id: `socket-${playerNo}`,
    join: jest.fn(),
    data: {
      user: { username: `Player ${playerNo}` },
      activeDeck: []
    }
  }) as unknown as Socket;

const createMatch = (): Match => new Match('test-room', createSocket(0), createSocket(1));

const createShip = (player: Player, card: MockHullCard, zone: Zone = Zone.Orbital): RootCardStack =>
  new RootCardStack(card, zone, player);

describe('Bot strategy', () => {
  describe('fleetStrength', () => {
    test('sums remaining hp and weapon damage of the fleet', () => {
      const match = createMatch();
      const player = match.players[0];
      const ship = createShip(player, new MockHullCard(1, 10, 2));
      ship.damage = 3;
      ship.attach(new AttachmentCardStack(new MockWeaponCard(100, 4), ship));
      match.battle = new Battle(BattleType.Mission, 0);
      match.battle.ships[0] = [ship];

      expect(fleetStrength([ship])).toBe(7 + 4);
    });

    test('is zero for an empty fleet', () => {
      expect(fleetStrength([])).toBe(0);
    });
  });

  describe('selectHandCard', () => {
    test('picks the playable card with the highest rarity', () => {
      const match = createMatch();
      const player = match.players[0];
      const hand = [1, 3, 2].map(
        rarity =>
          new PlayableCardStack(
            new MockCard(rarity, `Card ${rarity}`, CardType.Hull, rarity as CardRarity),
            player,
            true
          )
      );

      expect(selectHandCard(hand)).toBe(hand[1]);
    });

    test('breaks rarity ties by draw order', () => {
      const match = createMatch();
      const player = match.players[0];
      const hand = [2, 2].map(
        rarity =>
          new PlayableCardStack(
            new MockCard(rarity, `Card ${rarity}`, CardType.Hull, rarity as CardRarity),
            player,
            true
          )
      );

      expect(selectHandCard(hand)).toBe(hand[0]);
    });

    test('only considers cards with valid targets', () => {
      const match = createMatch();
      const player = match.players[0];
      const unplayable = new PlayableCardStack(
        new MockCard(1, 'Unplayable', CardType.Hull, 5),
        player,
        false
      );
      const playable = new PlayableCardStack(new MockCard(2, 'Playable', CardType.Hull, 1), player, true);
      const hand = [unplayable, playable];

      expect(selectHandCard(hand)).toBe(playable);
    });

    test('returns undefined without playable cards', () => {
      const match = createMatch();
      const player = match.players[0];
      const hand = [new PlayableCardStack(new MockCard(1, 'Unplayable', CardType.Hull, 1), player, false)];

      expect(selectHandCard(hand)).toBeUndefined();
    });
  });

  describe('selectTarget', () => {
    test('picks one of the valid targets', () => {
      const match = createMatch();
      const player = match.players[0];
      const targets = [
        createShip(player, new MockHullCard(1, 5, 1)),
        createShip(player, new MockHullCard(2, 5, 1))
      ];
      const handCard = new PlayableCardStack(
        new MockCard(3, 'Tactic', CardType.Tactic, 1),
        player,
        true,
        targets
      );

      expect(targets).toContain(selectTarget(handCard));
    });

    test('returns undefined without valid targets', () => {
      const match = createMatch();
      const player = match.players[0];
      const handCard = new PlayableCardStack(new MockCard(3, 'Tactic', CardType.Tactic, 1), player, false);

      expect(selectTarget(handCard)).toBeUndefined();
    });
  });

  describe('planBattle', () => {
    test('declares a mission with all mission-ready ships when clearly stronger', () => {
      const match = createMatch();
      const player = match.players[0];
      const ships = [
        createShip(player, new MockHullCard(1, 10, 2)),
        createShip(player, new MockHullCard(2, 10, 2))
      ];
      player.cardStacks.push(...ships);
      const opponent = match.players[1];
      opponent.cardStacks.push(createShip(opponent, new MockHullCard(3, 4, 2)));

      const plannedBattle = planBattle(player);

      expect(plannedBattle.type).toBe(BattleType.Mission);
      expect(plannedBattle.shipIds).toEqual(ships.map(cs => cs.uuid));
    });

    test('declares a mission when the opponent has no orbital ships', () => {
      const match = createMatch();
      const player = match.players[0];
      const ships = [createShip(player, new MockHullCard(1, 6, 2))];
      player.cardStacks.push(...ships);

      expect(planBattle(player).type).toBe(BattleType.Mission);
    });

    test('passes when the own fleet is not clearly stronger', () => {
      const match = createMatch();
      const player = match.players[0];
      player.cardStacks.push(createShip(player, new MockHullCard(1, 10, 2)));
      const opponent = match.players[1];
      opponent.cardStacks.push(createShip(opponent, new MockHullCard(2, 10, 2)));

      const plannedBattle = planBattle(player);

      expect(plannedBattle.type).toBe(BattleType.None);
      expect(plannedBattle.shipIds).toEqual([]);
    });

    test('passes without mission-ready ships', () => {
      const match = createMatch();
      const player = match.players[0];

      expect(planBattle(player).type).toBe(BattleType.None);
    });
  });

  describe('selectInterceptingShips', () => {
    test('intercepts a mission with all interception ready ships when at least as strong', () => {
      const match = createMatch();
      const attacker = match.players[0];
      const defender = match.players[1];
      match.activePlayerNo = 0;
      match.battle = new Battle(BattleType.Mission, 0);
      match.battle.ships[0] = [createShip(attacker, new MockHullCard(1, 10, 2), Zone.Neutral)];
      const interceptor = createShip(defender, new MockHullCard(2, 10, 3));
      defender.cardStacks.push(interceptor);

      expect(selectInterceptingShips(defender)).toEqual([interceptor.uuid]);
    });

    test('stays home when the own defense is weaker than the attacker', () => {
      const match = createMatch();
      const attacker = match.players[0];
      const defender = match.players[1];
      match.activePlayerNo = 0;
      match.battle = new Battle(BattleType.Mission, 0);
      match.battle.ships[0] = [createShip(attacker, new MockHullCard(1, 20, 2), Zone.Neutral)];
      defender.cardStacks.push(createShip(defender, new MockHullCard(2, 5, 3)));

      expect(selectInterceptingShips(defender)).toEqual([]);
    });

    test('keeps all mission-ready ships in orbit against a raid', () => {
      const match = createMatch();
      const attacker = match.players[0];
      const defender = match.players[1];
      match.activePlayerNo = 0;
      match.battle = new Battle(BattleType.Raid, 0);
      match.battle.ships[0] = [createShip(attacker, new MockHullCard(1, 20, 2), Zone.Neutral)];
      const defenders = [
        createShip(defender, new MockHullCard(2, 5, 3)),
        createShip(defender, new MockHullCard(3, 5, 2))
      ];
      defender.cardStacks.push(...defenders);

      expect(selectInterceptingShips(defender)).toEqual(defenders.map(cs => cs.uuid));
    });
  });

  describe('selectAttack', () => {
    const setupCombat = () => {
      const match = createMatch();
      const player = match.players[0];
      const opponent = match.players[1];
      match.pendingActionPlayerNo = 0;
      match.battle = new Battle(BattleType.Mission, 0);
      const ship = createShip(player, new MockHullCard(1, 10, 2), Zone.Neutral);
      const weapon = new AttachmentCardStack(new MockWeaponCard(100, 4), ship);
      ship.attach(weapon);
      weapon.attackAvailable = true;
      match.battle.ships[0] = [ship];
      const enemyShips = [
        createShip(opponent, new MockHullCard(2, 10, 2), Zone.Neutral),
        createShip(opponent, new MockHullCard(3, 10, 2), Zone.Neutral)
      ];
      match.battle.ships[1] = enemyShips;
      return { match, player, weapon, enemyShips };
    };

    test('attacks with the first available weapon on a valid target', () => {
      const { player, weapon, enemyShips } = setupCombat();

      const attack = selectAttack(player);

      expect(attack?.srcWeapon).toBe(weapon);
      expect(enemyShips).toContain(attack?.target);
    });

    test('focuses all weapons on the same target until it is destroyed', () => {
      const { match, player, enemyShips } = setupCombat();
      const firstAttack = selectAttack(player)!;

      const secondAttack = selectAttack(player, firstAttack.target.uuid)!;
      expect(secondAttack.target).toBe(firstAttack.target);

      // Focus target is destroyed and removed from the battle: a new target
      // among the survivors is picked
      match.battle.ships[1] = match.battle.ships[1].filter(cs => cs.uuid != firstAttack.target.uuid);
      const survivors = enemyShips.filter(cs => cs.uuid != firstAttack.target.uuid);
      const thirdAttack = selectAttack(player, firstAttack.target.uuid)!;
      expect(survivors).toContain(thirdAttack.target);
    });

    test('returns undefined when no weapon can attack', () => {
      const { player, weapon } = setupCombat();
      weapon.attackAvailable = false;

      expect(selectAttack(player)).toBeUndefined();
    });
  });
});
