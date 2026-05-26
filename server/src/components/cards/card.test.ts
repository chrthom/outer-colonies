import Card, { AttackResult } from './card';
import { CardSubtype, CardType, TacticDiscipline } from '../../shared/config/enums';
import CardStack from './card_stack';
import { AttackProfile } from './card_profile';
import Player from '../game_state/player';

class TestCard extends Card {
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame(): void {}
  onLeaveGame(): void {}
  onStartTurn(): void {}
  onEndTurn(): void {}

  // Expose protected helpers for testing.
  public exposedAttackStep(
    target: CardStack,
    attackProfile: AttackProfile,
    defendingShips: CardStack[],
    initialDamage: number
  ): AttackResult {
    return this.attackStep(target, attackProfile, defendingShips, new AttackResult(initialDamage));
  }
  public exposedRepairDamage(target: CardStack, amount: number) {
    return this.repairDamage(target, amount);
  }
  public exposedAdditionalCardWhenDrawing(player: Player, ...cardTypes: CardSubtype[]) {
    return this.additionalCardWhenDrawing(player, ...cardTypes);
  }
}

describe('Card.canDefend', () => {
  test('returns false when all defense values are 0', () => {
    const card = new TestCard(1, 'No Defense', CardType.Equipment, 1, {
      armour: 0,
      shield: 0,
      pointDefense: 0
    });
    expect(card.canDefend).toBe(false);
  });

  test('returns false when defense values are negative', () => {
    const card = new TestCard(2, 'Negative Defense', CardType.Equipment, 1, {
      armour: -1,
      shield: -2,
      pointDefense: -3
    });
    expect(card.canDefend).toBe(false);
  });

  test('returns true when any single defense value is positive', () => {
    const card = new TestCard(3, 'Armour Only', CardType.Hull, 1, {
      armour: 5,
      shield: 0,
      pointDefense: 0
    });
    expect(card.canDefend).toBe(true);
  });

  test('returns true when multiple defense values are positive', () => {
    const card = new TestCard(4, 'Multi Defense', CardType.Infrastructure, 1, {
      armour: 2,
      shield: 3,
      pointDefense: 1
    });
    expect(card.canDefend).toBe(true);
  });
});

interface MockProfile {
  armour: number;
  shield: number;
  pointDefense: number;
}

interface MockDefender {
  card: { profile: MockProfile; instantRecharge: boolean };
  profile: MockProfile;
  canDefend: () => boolean;
  deactivationPriority: number;
  defenseAvailable: boolean;
  cardStacks: MockDefender[];
}

const defender = (
  defense: { armour?: number; shield?: number; pointDefense?: number },
  opts: { instantRecharge?: boolean; deactivationPriority?: number; defenseAvailable?: boolean } = {}
): MockDefender => {
  const profile: MockProfile = { armour: 0, shield: 0, pointDefense: 0, ...defense };
  const obj: MockDefender = {
    card: { profile, instantRecharge: opts.instantRecharge ?? false },
    profile,
    canDefend: () => obj.defenseAvailable,
    deactivationPriority: opts.deactivationPriority ?? 10,
    defenseAvailable: opts.defenseAvailable ?? true,
    cardStacks: []
  };
  obj.cardStacks = [obj];
  return obj;
};

const ship = (...defenders: MockDefender[]) => ({ cardStacks: defenders }) as unknown as CardStack;

const attacker = new TestCard(99, 'Attacker', CardType.Equipment, 1);
const target = {} as CardStack;

const attack = (overrides: Partial<AttackProfile> = {}): AttackProfile => ({
  range: 0,
  damage: 0,
  pointDefense: 0,
  shield: 0,
  armour: 0,
  ...overrides
});

describe('Card.attackStep', () => {
  test('returns the input result unchanged when starting damage is 0', () => {
    const def = defender({ pointDefense: 2 });
    const result = attacker.exposedAttackStep(target, attack({ pointDefense: -3 }), [ship(def)], 0);

    expect(result.damage).toBe(0);
    expect(result.pointDefense).toBe(0);
    expect(result.shield).toBe(0);
    expect(result.armour).toBe(0);
    expect(def.defenseAvailable).toBe(true);
  });

  test('passes through all three phases when no defenders match, damage unchanged', () => {
    const result = attacker.exposedAttackStep(
      target,
      attack({ pointDefense: -3, shield: -3, armour: -3 }),
      [],
      10
    );

    expect(result.damage).toBe(10);
    expect(result.pointDefense).toBe(0);
    expect(result.shield).toBe(0);
    expect(result.armour).toBe(0);
  });

  test('point-defender absorbs damage and deactivates when damage >= reduction', () => {
    const def = defender({ pointDefense: 2 });
    // reduction = (-3) * -(2) = 6, damage = 10 → defender deactivates, 4 damage passes
    const result = attacker.exposedAttackStep(target, attack({ pointDefense: -3 }), [ship(def)], 10);

    expect(result.pointDefense).toBe(6);
    expect(result.damage).toBe(4);
    expect(def.defenseAvailable).toBe(false);
  });

  test('partial absorption: defender stays available when damage < reduction', () => {
    const def = defender({ pointDefense: 2 });
    // reduction = 6, damage = 4 → fully absorbed but defender NOT deactivated
    const result = attacker.exposedAttackStep(target, attack({ pointDefense: -3 }), [ship(def)], 4);

    expect(result.pointDefense).toBe(4);
    expect(result.damage).toBe(0);
    expect(def.defenseAvailable).toBe(true);
  });

  test('recursion walks PointDefense → Shield → Armour when earlier phases have no defenders', () => {
    const armourDef = defender({ armour: 2 });
    const result = attacker.exposedAttackStep(
      target,
      attack({ pointDefense: -3, shield: -3, armour: -3 }),
      [ship(armourDef)],
      10
    );

    expect(result.pointDefense).toBe(0);
    expect(result.shield).toBe(0);
    expect(result.armour).toBe(6);
    expect(result.damage).toBe(4);
    expect(armourDef.defenseAvailable).toBe(false);
  });

  test('selects the highest-priority defender first', () => {
    const low = defender({ pointDefense: 2 }, { deactivationPriority: 5 });
    const high = defender({ pointDefense: 2 }, { deactivationPriority: 20 });
    // damage = 6 → exactly absorbs one defender. The high-priority one should be picked.
    attacker.exposedAttackStep(target, attack({ pointDefense: -3 }), [ship(low, high)], 6);

    expect(high.defenseAvailable).toBe(false);
    expect(low.defenseAvailable).toBe(true);
  });

  test('skips defenders that report canDefend = false', () => {
    const blocked = defender({ pointDefense: 2 });
    blocked.canDefend = () => false;
    const result = attacker.exposedAttackStep(target, attack({ pointDefense: -3 }), [ship(blocked)], 10);

    expect(result.pointDefense).toBe(0);
    expect(result.damage).toBe(10);
    expect(blocked.defenseAvailable).toBe(true);
  });

  test('re-arms instant-recharge defenders at the Armour terminal', () => {
    const def = defender({ pointDefense: 1 }, { instantRecharge: true });
    // reduction = (-3) * -(1) = 3, damage = 10 → defender deactivates, 7 damage continues
    // recursion exhausts PD, Shield, Armour with no further defenders → armour terminal re-arms
    const result = attacker.exposedAttackStep(target, attack({ pointDefense: -3 }), [ship(def)], 10);

    expect(result.pointDefense).toBe(3);
    expect(result.damage).toBe(7);
    expect(def.defenseAvailable).toBe(true);
  });

  test('non-instant-recharge defender stays deactivated through the Armour terminal', () => {
    const def = defender({ pointDefense: 1 }, { instantRecharge: false });
    const result = attacker.exposedAttackStep(target, attack({ pointDefense: -3 }), [ship(def)], 10);

    expect(result.pointDefense).toBe(3);
    expect(result.damage).toBe(7);
    expect(def.defenseAvailable).toBe(false);
  });
});

describe('Card.repairDamage', () => {
  test('reduces damage by the given amount', () => {
    const stack = { damage: 8 } as CardStack;
    attacker.exposedRepairDamage(stack, 5);
    expect(stack.damage).toBe(3);
  });

  test('clamps at 0 when amount exceeds existing damage', () => {
    const stack = { damage: 3 } as CardStack;
    attacker.exposedRepairDamage(stack, 10);
    expect(stack.damage).toBe(0);
  });

  test('no-op when damage is already 0', () => {
    const stack = { damage: 0 } as CardStack;
    attacker.exposedRepairDamage(stack, 5);
    expect(stack.damage).toBe(0);
  });
});

// rules.cardsToDrawPerTurn is 2, so `getDrawnCards` returns the last two hand entries.
const handCard = (type: CardType, discipline?: TacticDiscipline) => ({
  card: { type, discipline }
});

const playerWithHand = (hand: ReturnType<typeof handCard>[]) =>
  ({ hand, drawCards: jest.fn() }) as unknown as Player;

describe('Card.additionalCardWhenDrawing', () => {
  test('no drawn card matches any filter: drawCards is NOT called', () => {
    const player = playerWithHand([handCard(CardType.Equipment), handCard(CardType.Equipment)]);
    attacker.exposedAdditionalCardWhenDrawing(player, CardType.Hull);
    expect(player.drawCards).not.toHaveBeenCalled();
  });

  test('drawn card matches a CardType filter: drawCards(1) is called', () => {
    const player = playerWithHand([handCard(CardType.Equipment), handCard(CardType.Hull)]);
    attacker.exposedAdditionalCardWhenDrawing(player, CardType.Hull);
    expect(player.drawCards).toHaveBeenCalledWith(1);
    expect(player.drawCards).toHaveBeenCalledTimes(1);
  });

  test('drawn Tactic card with matching discipline: drawCards(1) is called', () => {
    const player = playerWithHand([
      handCard(CardType.Equipment),
      handCard(CardType.Tactic, TacticDiscipline.Military)
    ]);
    attacker.exposedAdditionalCardWhenDrawing(player, TacticDiscipline.Military);
    expect(player.drawCards).toHaveBeenCalledWith(1);
  });

  test('drawn Tactic card with non-matching discipline: drawCards is NOT called', () => {
    const player = playerWithHand([
      handCard(CardType.Equipment),
      handCard(CardType.Tactic, TacticDiscipline.Military)
    ]);
    attacker.exposedAdditionalCardWhenDrawing(player, TacticDiscipline.Science);
    expect(player.drawCards).not.toHaveBeenCalled();
  });

  test('multiple matching drawn cards: drawCards(1) is called exactly once', () => {
    const player = playerWithHand([handCard(CardType.Hull), handCard(CardType.Hull)]);
    attacker.exposedAdditionalCardWhenDrawing(player, CardType.Hull);
    expect(player.drawCards).toHaveBeenCalledTimes(1);
  });

  test('matching card is older than the draw window: drawCards is NOT called', () => {
    // rules.cardsToDrawPerTurn = 2 → only the last two entries count.
    const player = playerWithHand([
      handCard(CardType.Hull), // older than the draw window
      handCard(CardType.Equipment),
      handCard(CardType.Equipment)
    ]);
    attacker.exposedAdditionalCardWhenDrawing(player, CardType.Hull);
    expect(player.drawCards).not.toHaveBeenCalled();
  });
});
