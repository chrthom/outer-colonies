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

    test('prefers an enemy ship in the orbital zone over an own ship', () => {
      const match = createMatch();
      const player = match.players[0];
      const opponent = match.players[1];
      const ownShip = createShip(player, new MockHullCard(1, 5, 1));
      const enemyShip = createShip(opponent, new MockHullCard(2, 5, 1));
      const handCard = new PlayableCardStack(new MockCard(3, 'Tactic', CardType.Tactic, 1), player, true, [
        ownShip,
        enemyShip
      ]);

      expect(selectTarget(handCard)).toBe(enemyShip);
    });

    test('prefers an enemy card in the colony zone over an own ship in the orbital zone', () => {
      const match = createMatch();
      const player = match.players[0];
      const opponent = match.players[1];
      const ownShip = createShip(player, new MockHullCard(1, 5, 1));
      const enemyInfrastructure = new RootCardStack(
        new MockCard(4, 'Infrastructure', CardType.Infrastructure, 1),
        Zone.Colony,
        opponent
      );
      const handCard = new PlayableCardStack(new MockCard(3, 'Tactic', CardType.Tactic, 1), player, true, [
        ownShip,
        enemyInfrastructure
      ]);

      expect(selectTarget(handCard)).toBe(enemyInfrastructure);
    });

    test('prefers an enemy ship in the neutral zone over the enemy colony', () => {
      const match = createMatch();
      const player = match.players[0];
      const opponent = match.players[1];
      const enemyShip = createShip(opponent, new MockHullCard(2, 5, 1), Zone.Neutral);
      const enemyColony = new RootCardStack(
        new MockCard(5, 'Enemy Colony', CardType.Colony, 1),
        Zone.Colony,
        opponent
      );
      const handCard = new PlayableCardStack(new MockCard(3, 'Tactic', CardType.Tactic, 1), player, true, [
        enemyShip,
        enemyColony
      ]);

      expect(selectTarget(handCard)).toBe(enemyShip);
    });

    test('prefers an own ship in the orbital zone over an own card in the colony zone', () => {
      const match = createMatch();
      const player = match.players[0];
      const ownShip = createShip(player, new MockHullCard(1, 5, 1));
      const ownInfrastructure = new RootCardStack(
        new MockCard(4, 'Infrastructure', CardType.Infrastructure, 1),
        Zone.Colony,
        player
      );
      const handCard = new PlayableCardStack(new MockCard(3, 'Tactic', CardType.Tactic, 1), player, true, [
        ownShip,
        ownInfrastructure
      ]);

      expect(selectTarget(handCard)).toBe(ownShip);
    });

    test('prefers an own card in the colony zone over the own colony', () => {
      const match = createMatch();
      const player = match.players[0];
      const ownInfrastructure = new RootCardStack(
        new MockCard(4, 'Infrastructure', CardType.Infrastructure, 1),
        Zone.Colony,
        player
      );
      const ownColony = new RootCardStack(
        new MockCard(5, 'Own Colony', CardType.Colony, 1),
        Zone.Colony,
        player
      );
      const handCard = new PlayableCardStack(new MockCard(3, 'Tactic', CardType.Tactic, 1), player, true, [
        ownInfrastructure,
        ownColony
      ]);

      expect(selectTarget(handCard)).toBe(ownInfrastructure);
    });

    test('targets the own colony when it is the only valid target', () => {
      const match = createMatch();
      const player = match.players[0];
      const ownColony = new RootCardStack(
        new MockCard(5, 'Own Colony', CardType.Colony, 1),
        Zone.Colony,
        player
      );
      const handCard = new PlayableCardStack(new MockCard(3, 'Tactic', CardType.Tactic, 1), player, true, [
        ownColony
      ]);

      expect(selectTarget(handCard)).toBe(ownColony);
    });

    test('returns undefined without valid targets', () => {
      const match = createMatch();
      const player = match.players[0];
      const handCard = new PlayableCardStack(new MockCard(3, 'Tactic', CardType.Tactic, 1), player, false);

      expect(selectTarget(handCard)).toBeUndefined();
    });
  });

  describe('planBattle', () => {
    test('declares a mission with all ships when the fleet matches the enemy total', () => {
      const match = createMatch();
      const player = match.players[0];
      const ships = [
        createShip(player, new MockHullCard(1, 5, 2)),
        createShip(player, new MockHullCard(2, 5, 2))
      ];
      player.cardStacks.push(...ships);
      const opponent = match.players[1];
      opponent.cardStacks.push(createShip(opponent, new MockHullCard(3, 7, 2)));

      const plannedBattle = planBattle(player);

      expect(plannedBattle.type).toBe(BattleType.Mission);
      expect(plannedBattle.shipIds).toEqual(ships.map(cs => cs.uuid));
    });

    test('declares a mission with only the fastest ships', () => {
      const match = createMatch();
      const player = match.players[0];
      const fastShip = createShip(player, new MockHullCard(1, 6, 4));
      player.cardStacks.push(fastShip, createShip(player, new MockHullCard(2, 6, 2)));
      const opponent = match.players[1];
      opponent.cardStacks.push(createShip(opponent, new MockHullCard(3, 9, 2)));

      const plannedBattle = planBattle(player);

      expect(plannedBattle.type).toBe(BattleType.Mission);
      expect(plannedBattle.shipIds).toEqual([fastShip.uuid]);
    });

    test('ignores enemy ships in the neutral zone as interceptors', () => {
      const match = createMatch();
      const player = match.players[0];
      const fastShip = createShip(player, new MockHullCard(1, 10, 4));
      player.cardStacks.push(fastShip, createShip(player, new MockHullCard(2, 4, 2)));
      const opponent = match.players[1];
      opponent.cardStacks.push(
        createShip(opponent, new MockHullCard(3, 10, 4)),
        createShip(opponent, new MockHullCard(4, 4, 5), Zone.Neutral)
      );

      const plannedBattle = planBattle(player);

      expect(plannedBattle.type).toBe(BattleType.Mission);
      expect(plannedBattle.shipIds).toEqual([fastShip.uuid]);
    });

    test('passes when the fastest ships are weaker than the intercepting enemy ships', () => {
      const match = createMatch();
      const player = match.players[0];
      player.cardStacks.push(
        createShip(player, new MockHullCard(1, 6, 4)),
        createShip(player, new MockHullCard(2, 6, 2))
      );
      const opponent = match.players[1];
      opponent.cardStacks.push(createShip(opponent, new MockHullCard(3, 9, 5)));

      const plannedBattle = planBattle(player);

      expect(plannedBattle.type).toBe(BattleType.None);
      expect(plannedBattle.shipIds).toEqual([]);
    });

    test('declares a raid when the opponent has no orbital ships', () => {
      const match = createMatch();
      const player = match.players[0];
      const ships = [createShip(player, new MockHullCard(1, 6, 2))];
      player.cardStacks.push(...ships);

      const plannedBattle = planBattle(player);

      expect(plannedBattle.type).toBe(BattleType.Raid);
      expect(plannedBattle.shipIds).toEqual(ships.map(cs => cs.uuid));
    });

    test('declares a raid when the fleet clearly overwhelms the orbital defense', () => {
      const match = createMatch();
      const player = match.players[0];
      player.cardStacks.push(createShip(player, new MockHullCard(1, 20, 2)));
      const opponent = match.players[1];
      opponent.cardStacks.push(createShip(opponent, new MockHullCard(2, 8, 2)));

      expect(planBattle(player).type).toBe(BattleType.Raid);
    });

    test('passes when the own fleet is weaker than the enemy total', () => {
      const match = createMatch();
      const player = match.players[0];
      player.cardStacks.push(createShip(player, new MockHullCard(1, 9, 2)));
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
      const { player, enemyShips } = setupCombat();
      const firstAttack = selectAttack(player)!;

      const secondAttack = selectAttack(player, firstAttack.target.uuid)!;
      expect(secondAttack.target).toBe(firstAttack.target);

      // Focus target is destroyed: like in the real game flow it stays in
      // battle.ships (destroyed hulls are only pruned from the player's card
      // stacks at the end of each battle round), so the aliveness filter must
      // release the focus and a new target among the survivors is picked
      firstAttack.target.damage = firstAttack.target.profile.hp;
      const survivors = enemyShips.filter(cs => cs.uuid != firstAttack.target.uuid);
      const thirdAttack = selectAttack(player, firstAttack.target.uuid)!;
      expect(survivors).toContain(thirdAttack.target);
    });

    test('does not pick a destroyed ship as a new target', () => {
      const { match, player, enemyShips } = setupCombat();
      enemyShips.forEach(cs => (cs.damage = cs.profile.hp));

      expect(selectAttack(player)).toBeUndefined();
      // The destroyed hulls are still in the battle's ship pool, so the
      // undefined result must come from the aliveness filter
      expect(match.battle.ships[1].length).toBe(enemyShips.length);
    });

    test('returns undefined when no weapon can attack', () => {
      const { player, weapon } = setupCombat();
      weapon.attackAvailable = false;

      expect(selectAttack(player)).toBeUndefined();
    });
  });
});
