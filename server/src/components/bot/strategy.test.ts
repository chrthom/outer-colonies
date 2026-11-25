import { BattleType, Zone } from '../../shared/config/enums';
import {
  ClientCard,
  ClientCardStack,
  ClientHandCard,
  ClientState,
  emptyClientState
} from '../../shared/interfaces/client_state';
import {
  fleetStrength,
  planBattle,
  selectAttack,
  selectCardOptions,
  selectHandCard,
  selectInterceptingShips,
  selectRetractableCard,
  selectTarget
} from './strategy';

// Real public card IDs from CardCollection:
// 0: Colony (Colony, rarity 0, hp 50)
// 160: Leichter Frachter (Hull, rarity 1, hp 5, speed 4)
// 220: Blockadebrecher (Hull, rarity 2, hp 4, speed 5)
// 436: Panzerschiff (Hull, rarity 2, hp 7, speed 2)
// 185: Kraftwerk (Infrastructure, rarity 1, energy +3)
// 179: Pulskanone (Equipment, rarity 1, damage 2)
// 125: Kinetikwaffenbatterie (Equipment, rarity 3, damage 4)
// 173: Ausweichmanöver (Tactic, rarity 1)
// 331: Schadenskontrolle (Tactic, rarity 2)
// 214: Bombenanschlag (Tactic, rarity 3)

const makeClientCard = (id: number, overrides: Partial<ClientCard> = {}): ClientCard => ({
  uuid: `card-${id}-${Math.random().toString(36).slice(2, 7)}`,
  id,
  index: 0,
  battleReady: false,
  retractable: false,
  insufficientEnergy: false,
  ...overrides
});

const makeStack = (
  uuid: string,
  cardIds: number[],
  ownedByPlayer: boolean,
  zone: Zone = Zone.Orbital,
  overrides: Partial<ClientCardStack> = {}
): ClientCardStack => ({
  uuid,
  cards: cardIds.map((id, index) => makeClientCard(id, { index })),
  zone,
  index: 0,
  zoneCardsNum: 1,
  ownedByPlayer,
  missionReady: ownedByPlayer && zone == Zone.Orbital && cardIds.some(id => id != 0),
  interceptionReady: false,
  attributes: [],
  ...overrides
});

const makeShip = (
  uuid: string,
  hullId: number,
  ownedByPlayer: boolean,
  zone: Zone = Zone.Orbital,
  damage: number = 0,
  hp: number = 5,
  extraCardIds: number[] = [],
  overrides: Partial<ClientCardStack> = {}
): ClientCardStack =>
  makeStack(uuid, [...extraCardIds, hullId], ownedByPlayer, zone, {
    attributes: [
      ...(damage > 0 ? [{ icon: 'damage', value: damage, warning: true }] : []),
      { icon: 'hp', value: hp, warning: damage >= hp }
    ],
    ...overrides
  });

const makeHandCard = (
  uuid: string,
  cardId: number,
  playable: boolean = true,
  validTargets: string[] = ['target-1'],
  overrides: Partial<ClientHandCard> = {}
): ClientHandCard => ({
  uuid,
  cardId,
  index: 0,
  playable,
  validTargets,
  ownedByPlayer: true,
  optionsToSelect: 0,
  ...overrides
});

const makeState = (overrides: Partial<ClientState> = {}): ClientState => ({
  ...emptyClientState,
  ...overrides
});

describe('Bot strategy', () => {
  describe('fleetStrength', () => {
    test('sums remaining hp and weapon damage of the fleet', () => {
      // Leichter Frachter (hp 5, damage 2 -> 3) + Kinetikwaffenbatterie (damage 4) = 7
      const ship = makeShip('ship-1', 160, true, Zone.Orbital, 2, 5, [125]);

      expect(fleetStrength([ship])).toBe(7);
    });

    test('is zero for an empty fleet', () => {
      expect(fleetStrength([])).toBe(0);
    });
  });

  describe('selectHandCard', () => {
    test('picks the playable card with the highest rarity', () => {
      const hand = [
        makeHandCard('h1', 173, true), // rarity 1
        makeHandCard('h2', 214, true), // rarity 3
        makeHandCard('h3', 331, true) // rarity 2
      ];

      expect(selectHandCard(hand)).toBe(hand[1]);
    });

    test('breaks rarity ties by draw order', () => {
      const hand = [
        makeHandCard('h1', 220, true), // rarity 2
        makeHandCard('h2', 436, true) // rarity 2
      ];

      expect(selectHandCard(hand)).toBe(hand[0]);
    });

    test('only considers playable cards with valid targets', () => {
      const unplayable = makeHandCard('h1', 214, false, ['t1']);
      const noTargets = makeHandCard('h2', 214, true, []);
      const playable = makeHandCard('h3', 173, true, ['t1']);

      expect(selectHandCard([unplayable, noTargets, playable])).toBe(playable);
    });

    test('skips cards requiring options when insufficient options are available', () => {
      const needsOptions = makeHandCard('h1', 214, true, ['t1'], { optionsToSelect: 1, options: [] });
      const playable = makeHandCard('h2', 173, true, ['t1']);

      expect(selectHandCard([needsOptions, playable])).toBe(playable);
    });

    test('returns undefined without playable cards', () => {
      expect(selectHandCard([makeHandCard('h1', 173, false, [])])).toBeUndefined();
    });
  });

  describe('selectCardOptions', () => {
    test('returns undefined when no options are needed and slices required options otherwise', () => {
      expect(selectCardOptions(makeHandCard('h1', 173))).toBeUndefined();
      expect(
        selectCardOptions(
          makeHandCard('h2', 214, true, ['t1'], { optionsToSelect: 2, options: [10, 20, 30] })
        )
      ).toEqual([10, 20]);
    });
  });

  describe('selectTarget', () => {
    test('picks one of the valid targets', () => {
      const s1 = makeShip('s1', 160, true);
      const s2 = makeShip('s2', 160, true);
      const state = makeState({ cardStacks: [s1, s2] });
      const handCard = makeHandCard('h1', 173, true, ['s1', 's2']);

      expect([s1, s2]).toContain(selectTarget(handCard, state));
    });

    test('prefers an enemy ship in the orbital zone over an own ship', () => {
      const ownShip = makeShip('own', 160, true, Zone.Orbital);
      const enemyShip = makeShip('enemy', 160, false, Zone.Orbital);
      const state = makeState({ cardStacks: [ownShip, enemyShip] });
      const handCard = makeHandCard('h1', 173, true, ['own', 'enemy']);

      expect(selectTarget(handCard, state)).toBe(enemyShip);
    });

    test('prefers an enemy card in the colony zone over an own ship in the orbital zone', () => {
      const ownShip = makeShip('own', 160, true, Zone.Orbital);
      const enemyInfra = makeStack('enemy-infra', [185], false, Zone.Colony);
      const state = makeState({ cardStacks: [ownShip, enemyInfra] });
      const handCard = makeHandCard('h1', 173, true, ['own', 'enemy-infra']);

      expect(selectTarget(handCard, state)).toBe(enemyInfra);
    });

    test('prefers an enemy ship in the neutral zone over the enemy colony', () => {
      const enemyShip = makeShip('enemy-ship', 160, false, Zone.Neutral);
      const enemyColony = makeStack('enemy-colony', [0], false, Zone.Colony);
      const state = makeState({ cardStacks: [enemyShip, enemyColony] });
      const handCard = makeHandCard('h1', 173, true, ['enemy-ship', 'enemy-colony']);

      expect(selectTarget(handCard, state)).toBe(enemyShip);
    });

    test('prefers an own ship in the orbital zone over an own card in the colony zone', () => {
      const ownShip = makeShip('own-ship', 160, true, Zone.Orbital);
      const ownInfra = makeStack('own-infra', [185], true, Zone.Colony);
      const state = makeState({ cardStacks: [ownShip, ownInfra] });
      const handCard = makeHandCard('h1', 173, true, ['own-ship', 'own-infra']);

      expect(selectTarget(handCard, state)).toBe(ownShip);
    });

    test('prefers an own card in the colony zone over the own colony', () => {
      const ownInfra = makeStack('own-infra', [185], true, Zone.Colony);
      const ownColony = makeStack('own-colony', [0], true, Zone.Colony);
      const state = makeState({ cardStacks: [ownInfra, ownColony] });
      const handCard = makeHandCard('h1', 173, true, ['own-infra', 'own-colony']);

      expect(selectTarget(handCard, state)).toBe(ownInfra);
    });

    test('targets the own colony when it is the only valid target', () => {
      const ownColony = makeStack('own-colony', [0], true, Zone.Colony);
      const state = makeState({ cardStacks: [ownColony] });
      const handCard = makeHandCard('h1', 173, true, ['own-colony']);

      expect(selectTarget(handCard, state)).toBe(ownColony);
    });

    test('returns undefined without valid targets', () => {
      const state = makeState();
      const handCard = makeHandCard('h1', 173, false, []);

      expect(selectTarget(handCard, state)).toBeUndefined();
    });
  });

  describe('selectRetractableCard', () => {
    test('returns a retractable insufficient-energy sub-card', () => {
      const stack = makeStack('ship-1', [160, 179], true, Zone.Colony, {
        cards: [
          makeClientCard(160, { uuid: 'hull-uuid', index: 0, retractable: true, insufficientEnergy: false }),
          makeClientCard(179, { uuid: 'weapon-uuid', index: 1, retractable: true, insufficientEnergy: true })
        ]
      });
      const state = makeState({ cardStacks: [stack] });

      expect(selectRetractableCard(state)).toEqual({ rootUUID: 'ship-1', subUUID: 'weapon-uuid' });
    });

    test('ignores non-retractable insufficient-energy cards', () => {
      const stack = makeStack('infra-1', [185], true, Zone.Colony, {
        cards: [makeClientCard(185, { uuid: 'infra-uuid', retractable: false, insufficientEnergy: true })]
      });
      const state = makeState({ cardStacks: [stack] });

      expect(selectRetractableCard(state)).toBeUndefined();
    });
  });

  describe('planBattle', () => {
    test('declares a mission with all ships when the fleet matches the enemy total', () => {
      // Own: 2x Leichter Frachter (hp 5, speed 4) = 10
      // Enemy: 1x Panzerschiff (hp 7, speed 2) + Pulskanone (dmg 2) = 9
      const ownShips = [
        makeShip('s1', 160, true, Zone.Orbital, 0, 5),
        makeShip('s2', 160, true, Zone.Orbital, 0, 5)
      ];
      const enemyShip = makeShip('e1', 436, false, Zone.Orbital, 0, 7, [179]);
      const state = makeState({ cardStacks: [...ownShips, enemyShip] });

      const plannedBattle = planBattle(state);

      expect(plannedBattle.type).toBe(BattleType.Mission);
      expect(plannedBattle.shipIds).toEqual(['s1', 's2']);
    });

    test('declares a mission with only the fastest ships', () => {
      // Own: Blockadebrecher (hp 4, speed 5) + Kinetikwaffenbatterie (dmg 4) = 8; Panzerschiff (hp 7, speed 2) = 7 -> total 15
      // Enemy: Panzerschiff (hp 7, speed 2) + Kinetikwaffenbatterie (dmg 4) = 11 (too slow to intercept speed 5)
      const fastShip = makeShip('fast', 220, true, Zone.Orbital, 0, 4, [125]);
      const slowShip = makeShip('slow', 436, true, Zone.Orbital, 0, 7);
      const enemyShip = makeShip('enemy', 436, false, Zone.Orbital, 0, 7, [125]);
      const state = makeState({ cardStacks: [fastShip, slowShip, enemyShip] });

      const plannedBattle = planBattle(state);

      expect(plannedBattle.type).toBe(BattleType.Mission);
      expect(plannedBattle.shipIds).toEqual(['fast']);
    });

    test('ignores enemy ships in the neutral zone as interceptors', () => {
      // Own: Blockadebrecher (4, speed 5) + 2x Panzerschiff/Kinetikwaffenbatterie (22, speed 2) + Leichter Frachter (5, speed 4) = 31
      // Enemy orbital: 2x Panzerschiff/Kinetikwaffenbatterie (22, speed 2 -> 31 < 22 * 1.5 = 33, no raid; too slow to intercept)
      // Enemy neutral: Blockadebrecher/Kinetikwaffenbatterie (8, speed 5 -> total enemy 30 <= 31; stronger than fastShip 4 if counted)
      const fastShip = makeShip('fast', 220, true, Zone.Orbital, 0, 4);
      const slowShips = [
        makeShip('slow-1', 436, true, Zone.Orbital, 0, 7, [125]),
        makeShip('slow-2', 436, true, Zone.Orbital, 0, 7, [125]),
        makeShip('slow-3', 160, true, Zone.Orbital, 0, 5)
      ];
      const enemyOrbital = [
        makeShip('e-orb-1', 436, false, Zone.Orbital, 0, 7, [125]),
        makeShip('e-orb-2', 436, false, Zone.Orbital, 0, 7, [125])
      ];
      const enemyNeutral = makeShip('e-neu', 220, false, Zone.Neutral, 0, 4, [125]);
      const state = makeState({ cardStacks: [fastShip, ...slowShips, ...enemyOrbital, enemyNeutral] });

      const plannedBattle = planBattle(state);

      expect(plannedBattle.type).toBe(BattleType.Mission);
      expect(plannedBattle.shipIds).toEqual(['fast']);
    });

    test('passes when the fastest ships are weaker than the intercepting enemy ships', () => {
      const fastShip = makeShip('fast', 220, true, Zone.Orbital, 0, 4); // strength 4, speed 5
      const slowShip = makeShip('slow', 436, true, Zone.Orbital, 0, 7); // strength 7, speed 2 -> total 11
      const enemyFast = makeShip('e-fast', 220, false, Zone.Orbital, 0, 4, [125]); // strength 8, speed 5
      const state = makeState({ cardStacks: [fastShip, slowShip, enemyFast] });

      const plannedBattle = planBattle(state);

      expect(plannedBattle.type).toBe(BattleType.None);
      expect(plannedBattle.shipIds).toEqual([]);
    });

    test('declares a raid when the opponent has no orbital ships', () => {
      const ownShip = makeShip('s1', 160, true, Zone.Orbital, 0, 5);
      const state = makeState({ cardStacks: [ownShip] });

      const plannedBattle = planBattle(state);

      expect(plannedBattle.type).toBe(BattleType.Raid);
      expect(plannedBattle.shipIds).toEqual(['s1']);
    });

    test('declares a raid when the fleet clearly overwhelms the orbital defense', () => {
      const ownShips = [
        makeShip('s1', 436, true, Zone.Orbital, 0, 7, [125]), // 11
        makeShip('s2', 436, true, Zone.Orbital, 0, 7) // 7 -> 18 >= 5 * 1.5
      ];
      const enemyShip = makeShip('e1', 160, false, Zone.Orbital, 0, 5);
      const state = makeState({ cardStacks: [...ownShips, enemyShip] });

      expect(planBattle(state).type).toBe(BattleType.Raid);
    });

    test('passes when the own fleet is weaker than the enemy total', () => {
      const ownShip = makeShip('s1', 160, true, Zone.Orbital, 0, 5);
      const enemyShip = makeShip('e1', 436, false, Zone.Orbital, 0, 7);
      const state = makeState({ cardStacks: [ownShip, enemyShip] });

      const plannedBattle = planBattle(state);

      expect(plannedBattle.type).toBe(BattleType.None);
      expect(plannedBattle.shipIds).toEqual([]);
    });

    test('passes without mission-ready ships', () => {
      const colonyShip = makeShip('s1', 160, true, Zone.Colony, 0, 5, [], { missionReady: false });
      const state = makeState({ cardStacks: [colonyShip] });

      expect(planBattle(state).type).toBe(BattleType.None);
    });
  });

  describe('selectInterceptingShips', () => {
    test('intercepts a mission with all interception ready ships when at least as strong', () => {
      const attacker = makeShip('att', 160, false, Zone.Neutral, 0, 5);
      const interceptor = makeShip('def', 436, true, Zone.Orbital, 0, 7, [], { interceptionReady: true });
      const state = makeState({
        cardStacks: [attacker, interceptor],
        battle: {
          type: BattleType.Mission,
          playerShipIds: [],
          opponentShipIds: ['att'],
          range: 4
        }
      });

      expect(selectInterceptingShips(state)).toEqual(['def']);
    });

    test('stays home when the own defense is weaker than the attacker', () => {
      const attacker = makeShip('att', 436, false, Zone.Neutral, 0, 7, [125]); // 11
      const interceptor = makeShip('def', 160, true, Zone.Orbital, 0, 5, [], { interceptionReady: true }); // 5
      const state = makeState({
        cardStacks: [attacker, interceptor],
        battle: {
          type: BattleType.Mission,
          playerShipIds: [],
          opponentShipIds: ['att'],
          range: 4
        }
      });

      expect(selectInterceptingShips(state)).toEqual([]);
    });

    test('keeps all mission-ready ships in orbit against a raid', () => {
      const attacker = makeShip('att', 436, false, Zone.Neutral, 0, 7);
      const def1 = makeShip('d1', 160, true, Zone.Orbital, 0, 5);
      const def2 = makeShip('d2', 436, true, Zone.Orbital, 0, 7);
      const state = makeState({
        cardStacks: [attacker, def1, def2],
        battle: {
          type: BattleType.Raid,
          playerShipIds: [],
          opponentShipIds: ['att'],
          range: 4
        }
      });

      expect(selectInterceptingShips(state)).toEqual(['d1', 'd2']);
    });
  });

  describe('selectAttack', () => {
    const setupCombat = (damage1: number = 0, damage2: number = 0, battleReady: boolean = true) => {
      const ownShip = makeStack('own-ship', [179, 160], true, Zone.Neutral, {
        cards: [
          makeClientCard(179, { uuid: 'weapon-1', index: 0, battleReady }),
          makeClientCard(160, { uuid: 'hull-1', index: 1 })
        ]
      });
      const enemy1 = makeShip('enemy-1', 160, false, Zone.Neutral, damage1, 5);
      const enemy2 = makeShip('enemy-2', 160, false, Zone.Neutral, damage2, 5);
      return makeState({
        cardStacks: [ownShip, enemy1, enemy2],
        battle: {
          type: BattleType.Mission,
          playerShipIds: ['own-ship'],
          opponentShipIds: ['enemy-1', 'enemy-2'],
          range: 1
        }
      });
    };

    test('attacks with the first available battle-ready weapon on a valid target', () => {
      const state = setupCombat();

      const attack = selectAttack(state);

      expect(attack?.shipUUID).toBe('own-ship');
      expect(attack?.weaponUUID).toBe('weapon-1');
      expect(['enemy-1', 'enemy-2']).toContain(attack?.targetUUID);
    });

    test('focuses all weapons on the same target until it is destroyed', () => {
      const state = setupCombat();
      const firstAttack = selectAttack(state)!;

      const secondAttack = selectAttack(state, firstAttack.targetUUID)!;
      expect(secondAttack.targetUUID).toBe(firstAttack.targetUUID);

      // Focus target is destroyed (damage == hp): must switch to a surviving target
      const destroyedState = setupCombat(
        firstAttack.targetUUID == 'enemy-1' ? 5 : 0,
        firstAttack.targetUUID == 'enemy-2' ? 5 : 0
      );
      const thirdAttack = selectAttack(destroyedState, firstAttack.targetUUID)!;
      expect(thirdAttack.targetUUID).not.toBe(firstAttack.targetUUID);
    });

    test('does not pick a destroyed ship as a new target', () => {
      const state = setupCombat(5, 5);

      expect(selectAttack(state)).toBeUndefined();
    });

    test('returns undefined when no weapon can attack', () => {
      const state = setupCombat(0, 0, false);

      expect(selectAttack(state)).toBeUndefined();
    });
  });
});
