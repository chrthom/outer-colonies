import TacticCard from './tactic_card';
import Card from '../card';
import CardStack from '../card_stack';
import { CardType, TacticDiscipline } from '../../../shared/config/enums';
import Player from '../../game_state/player';

class TestCard extends Card {
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame(): void {}
  onLeaveGame(): void {}
  onStartTurn(): void {}
  onEndTurn(): void {}
}

class TacticProbe extends TacticCard {
  constructor() {
    super(9999, 'Probe', 1, TacticDiscipline.Military);
  }
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame(): void {}

  // Expose protected helpers.
  public exposedTributeFromPile(params: number[] | undefined, pile: Card[], action: (card: Card) => void) {
    return this.tributeCardFromPile(params, pile, action);
  }
  public exposedTributeHandCard(
    player: Player,
    params: number[] | undefined,
    action: (uuid: string) => void
  ) {
    return this.tributeHandCard(player, params, action);
  }
  public exposedTributeMultiple(params: number[] | undefined, pile: Card[], action: (card: Card) => void) {
    return this.tributeMultipleFromPile(params, pile, action);
  }
  public exposedTogglePointDefense(targets: CardStack[], count: number, newState: boolean) {
    return this.togglePointDefense(targets, count, newState);
  }
}

const probe = new TacticProbe();
const makeCard = (id: number) => new TestCard(id, `Card${id}`, CardType.Equipment, 1);

describe('TacticCard.tributeCardFromPile', () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => warnSpy.mockRestore());

  test('no-op when optionalParameters is undefined', () => {
    const pile = [makeCard(1), makeCard(2)];
    const action = jest.fn();
    probe.exposedTributeFromPile(undefined, pile, action);
    expect(action).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(pile).toHaveLength(2);
  });

  test('no-op when optionalParameters is empty', () => {
    const pile = [makeCard(1)];
    const action = jest.fn();
    probe.exposedTributeFromPile([], pile, action);
    expect(action).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(pile).toHaveLength(1);
  });

  test('splices the matching card from the pile and calls action', () => {
    const c1 = makeCard(1);
    const c2 = makeCard(2);
    const pile = [c1, c2];
    const action = jest.fn();
    probe.exposedTributeFromPile([2], pile, action);
    expect(action).toHaveBeenCalledWith(c2);
    expect(pile).toEqual([c1]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('logs warning and leaves pile untouched when id not in pile', () => {
    const pile = [makeCard(1)];
    const action = jest.fn();
    probe.exposedTributeFromPile([99], pile, action);
    expect(action).not.toHaveBeenCalled();
    expect(pile).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  test('only consults the first optionalParameter', () => {
    const c1 = makeCard(1);
    const c2 = makeCard(2);
    const pile = [c1, c2];
    const action = jest.fn();
    probe.exposedTributeFromPile([1, 2], pile, action);
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith(c1);
    expect(pile).toEqual([c2]);
  });
});

describe('TacticCard.tributeHandCard', () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => warnSpy.mockRestore());

  const makePlayer = (handIds: number[]) =>
    ({
      hand: handIds.map(id => ({ card: makeCard(id), uuid: `uuid-${id}` }))
    }) as unknown as Player;

  test('no-op when optionalParameters is undefined', () => {
    const action = jest.fn();
    probe.exposedTributeHandCard(makePlayer([1]), undefined, action);
    expect(action).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('calls action with the UUID of the matching hand card', () => {
    const action = jest.fn();
    probe.exposedTributeHandCard(makePlayer([1, 2, 3]), [2], action);
    expect(action).toHaveBeenCalledWith('uuid-2');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('warns when no hand card has the requested id', () => {
    const action = jest.fn();
    probe.exposedTributeHandCard(makePlayer([1]), [99], action);
    expect(action).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('TacticCard.tributeMultipleFromPile', () => {
  test('no-op when optionalParameters is undefined', () => {
    const pile = [makeCard(1), makeCard(2)];
    const action = jest.fn();
    probe.exposedTributeMultiple(undefined, pile, action);
    expect(action).not.toHaveBeenCalled();
    expect(pile).toHaveLength(2);
  });

  test('splices every requested card and calls action for each', () => {
    const c1 = makeCard(1);
    const c2 = makeCard(2);
    const c3 = makeCard(3);
    const pile = [c1, c2, c3];
    const action = jest.fn();
    probe.exposedTributeMultiple([1, 3], pile, action);
    expect(action).toHaveBeenCalledTimes(2);
    expect(action).toHaveBeenCalledWith(c1);
    expect(action).toHaveBeenCalledWith(c3);
    expect(pile).toEqual([c2]);
  });

  test('silently skips ids that are not in the pile', () => {
    const warnSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const c1 = makeCard(1);
    const pile = [c1];
    const action = jest.fn();
    probe.exposedTributeMultiple([1, 99], pile, action);
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith(c1);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

interface MockPdStack {
  card: { profile: { pointDefense: number } };
  defenseAvailable: boolean;
  cardStacks: MockPdStack[];
}

const pd = (level: 1 | 2, defenseAvailable: boolean): MockPdStack => {
  const obj: MockPdStack = {
    card: { profile: { pointDefense: level } },
    defenseAvailable,
    cardStacks: []
  };
  obj.cardStacks = [obj];
  return obj;
};

const ship = (...stacks: MockPdStack[]) => ({ cardStacks: stacks }) as unknown as CardStack;

describe('TacticCard.togglePointDefense', () => {
  test('count = 0 makes no changes', () => {
    const lvl2 = pd(2, false);
    probe.exposedTogglePointDefense([ship(lvl2)], 0, true);
    expect(lvl2.defenseAvailable).toBe(false);
  });

  test('activate consumes a level-2 defender first', () => {
    const lvl1 = pd(1, false);
    const lvl2 = pd(2, false);
    probe.exposedTogglePointDefense([ship(lvl1, lvl2)], 2, true);
    expect(lvl2.defenseAvailable).toBe(true);
    expect(lvl1.defenseAvailable).toBe(false);
  });

  test('activate falls back to level-1 when count is insufficient for level-2', () => {
    const lvl1 = pd(1, false);
    const lvl2 = pd(2, false);
    probe.exposedTogglePointDefense([ship(lvl1, lvl2)], 1, true);
    expect(lvl1.defenseAvailable).toBe(true);
    expect(lvl2.defenseAvailable).toBe(false);
  });

  test('activate spends one level-2 and one level-1 with count = 3', () => {
    const lvl1 = pd(1, false);
    const lvl2 = pd(2, false);
    probe.exposedTogglePointDefense([ship(lvl1, lvl2)], 3, true);
    expect(lvl1.defenseAvailable).toBe(true);
    expect(lvl2.defenseAvailable).toBe(true);
  });

  test('activate exits early when no further matching defenders are available', () => {
    const lvl2 = pd(2, false);
    probe.exposedTogglePointDefense([ship(lvl2)], 10, true);
    expect(lvl2.defenseAvailable).toBe(true);
  });

  test('deactivate flips defenseAvailable on currently-available defenders', () => {
    const lvl2 = pd(2, true);
    const lvl1 = pd(1, true);
    probe.exposedTogglePointDefense([ship(lvl2, lvl1)], 3, false);
    expect(lvl2.defenseAvailable).toBe(false);
    expect(lvl1.defenseAvailable).toBe(false);
  });

  test('deactivate ignores defenders that are already deactivated', () => {
    const lvl2 = pd(2, false);
    const lvl1 = pd(1, true);
    probe.exposedTogglePointDefense([ship(lvl2, lvl1)], 2, false);
    expect(lvl2.defenseAvailable).toBe(false); // unchanged
    expect(lvl1.defenseAvailable).toBe(false); // got flipped
  });
});
