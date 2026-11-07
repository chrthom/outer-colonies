import CardStack from '../card_stack';
import { AttackProfile } from '../card_profile';
import EquipmentCard from './equipment_card';

class TestWeaponCard extends EquipmentCard {
  constructor(attackProfile: AttackProfile) {
    super(1, 'Test Weapon', 1, {}, attackProfile);
  }
}

interface MockMatch {
  battle: { range: number; ships: CardStack[][] };
  waitingPlayerNo: number;
}

const createMatch = (range: number, defendingShips: CardStack[] = []): MockMatch => ({
  battle: { range, ships: [[], defendingShips] },
  waitingPlayerNo: 1
});

const attackingShip = (match: MockMatch, speed: number) =>
  ({ profile: { speed }, player: { match } }) as unknown as CardStack;

const weaponStack = (ship: CardStack) => ({ rootCardStack: ship }) as unknown as CardStack;

const targetShip = (speed: number, isFlightReady = true) =>
  ({ isFlightReady, profile: { speed }, damage: 0 }) as unknown as CardStack;

const defenderStack = (pointDefense: number) => {
  const profile = { pointDefense, shield: 0, armour: 0 };
  const obj = {
    card: { profile },
    profile,
    canDefend: () => true,
    deactivationPriority: 10,
    defenseAvailable: true,
    cardStacks: [] as CardStack[]
  };
  obj.cardStacks = [obj as unknown as CardStack];
  return obj as unknown as CardStack;
};

const attackWith = (opts: {
  attackerSpeed: number;
  targetSpeed: number;
  range: number;
  damage?: number;
  isFlightReady?: boolean;
  defendingShips?: CardStack[];
}) => {
  const weapon = new TestWeaponCard({
    range: 4,
    damage: opts.damage ?? 10,
    pointDefense: 0,
    shield: 0,
    armour: 0
  });
  const match = createMatch(opts.range, opts.defendingShips ?? []);
  const ship = attackingShip(match, opts.attackerSpeed);
  const target = targetShip(opts.targetSpeed, opts.isFlightReady ?? true);
  const result = weapon.attack(weaponStack(ship), target);
  return { result, target };
};

describe('EquipmentCard.attack halving rule', () => {
  test('halves damage on speed ties: attacker speed + range equals target speed', () => {
    const { result, target } = attackWith({ attackerSpeed: 2, targetSpeed: 5, range: 3 });

    expect(result.damage).toBe(5);
    expect(target.damage).toBe(5);
  });

  test('halves damage when attacker speed + range is below target speed', () => {
    const { result, target } = attackWith({ attackerSpeed: 2, targetSpeed: 6, range: 3 });

    expect(result.damage).toBe(5);
    expect(target.damage).toBe(5);
  });

  test('does not halve damage when attacker speed + range exceeds target speed', () => {
    const { result, target } = attackWith({ attackerSpeed: 2, targetSpeed: 4, range: 3 });

    expect(result.damage).toBe(10);
    expect(target.damage).toBe(10);
  });

  test('rounds halved odd damage up', () => {
    const { result } = attackWith({ attackerSpeed: 2, targetSpeed: 5, range: 3, damage: 11 });

    expect(result.damage).toBe(6);
  });

  test('does not halve damage of targets that are not flight ready', () => {
    const { result, target } = attackWith({
      attackerSpeed: 2,
      targetSpeed: 6,
      range: 3,
      isFlightReady: false
    });

    expect(result.damage).toBe(10);
    expect(target.damage).toBe(10);
  });

  test('applies halving before point defense reductions', () => {
    // Weapon deals 12 damage with a point defense attack stat of -3, the defending
    // ship carries a point defense card of 2 (reduction = -3 * -2 = 6). On a speed
    // tie the damage is halved first (12 -> 6) and then fully absorbed (6 - 6 = 0).
    const weapon = new TestWeaponCard({
      range: 4,
      damage: 12,
      pointDefense: -3,
      shield: 0,
      armour: 0
    });
    const match = createMatch(3, [{ cardStacks: [defenderStack(2)] } as unknown as CardStack]);
    const target = targetShip(5);

    const result = weapon.attack(weaponStack(attackingShip(match, 2)), target);

    expect(result.damage).toBe(0);
    expect(result.pointDefense).toBe(6);
    expect(target.damage).toBe(0);
  });
});
