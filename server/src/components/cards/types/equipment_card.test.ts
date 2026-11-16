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

const defenderStack = (pointDefense: number) =>
  defenderStackWithProfile({ pointDefense, shield: 0, armour: 0 });

const defenderStackWithProfile = (profile: { pointDefense: number; shield: number; armour: number }) => {
  const obj = {
    card: { profile },
    profile,
    canDefend: () => obj.defenseAvailable,
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

describe('EquipmentCard.attack X deduction semantics', () => {
  test('X shield deduction deals 0 damage and leaves the shield card active', () => {
    // X deduction (-99): the attack is fully absorbed by the shield card without
    // deactivating it (issue #795 X switches, e.g. 157 Plasmawerfer)
    const weapon = new TestWeaponCard({
      range: 4,
      damage: 7,
      pointDefense: 0,
      shield: -99,
      armour: -1
    });
    const shieldDefender = defenderStackWithProfile({ pointDefense: 0, shield: 2, armour: 0 });
    const match = createMatch(3, [{ cardStacks: [shieldDefender] } as unknown as CardStack]);
    const target = targetShip(4);

    const result = weapon.attack(weaponStack(attackingShip(match, 2)), target);

    expect(result.damage).toBe(0);
    expect(result.shield).toBe(7);
    expect(target.damage).toBe(0);
    expect(shieldDefender.defenseAvailable).toBe(true);
  });

  test('X armour deduction deals 0 damage and leaves the armour card active', () => {
    // X deduction (-99): the attack is fully absorbed by the armour card without
    // deactivating it (issue #795 X switches, e.g. 130 Flakartillerie)
    const weapon = new TestWeaponCard({
      range: 4,
      damage: 6,
      pointDefense: 0,
      shield: 0,
      armour: -99
    });
    const armourDefender = defenderStackWithProfile({ pointDefense: 0, shield: 0, armour: 3 });
    const match = createMatch(3, [{ cardStacks: [armourDefender] } as unknown as CardStack]);
    const target = targetShip(4);

    const result = weapon.attack(weaponStack(attackingShip(match, 2)), target);

    expect(result.damage).toBe(0);
    expect(result.armour).toBe(6);
    expect(target.damage).toBe(0);
    expect(armourDefender.defenseAvailable).toBe(true);
  });

  test('numeric shield deduction deactivates the shield card when the damage suffices', () => {
    // Counterpart to the X deduction: a numeric deduction whose reduction does not
    // exceed the damage deactivates the defence card (reduction = -3 * -2 = 6 <= 7 damage)
    const weapon = new TestWeaponCard({
      range: 4,
      damage: 7,
      pointDefense: 0,
      shield: -3,
      armour: 0
    });
    const shieldDefender = defenderStackWithProfile({ pointDefense: 0, shield: 2, armour: 0 });
    const match = createMatch(3, [{ cardStacks: [shieldDefender] } as unknown as CardStack]);
    const target = targetShip(4);

    const result = weapon.attack(weaponStack(attackingShip(match, 2)), target);

    expect(result.damage).toBe(1);
    expect(shieldDefender.defenseAvailable).toBe(false);
    expect(target.damage).toBe(1);
  });
});
