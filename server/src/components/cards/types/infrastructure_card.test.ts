import { CardType } from '../../../shared/config/enums';
import CardStack from '../card_stack';
import Player from '../../game_state/player';
import InfrastructureCard from './infrastructure_card';

class TestInfra extends InfrastructureCard {
  constructor() {
    super(1, 'Test Infra', 1);
  }
}

class ColonyOnlyInfra extends InfrastructureCard {
  constructor() {
    super(2, 'Colony Only Infra', 1);
  }
  protected override get onlyAttachableToColony(): boolean {
    return true;
  }
}

const mockStack = (type: CardType, profileMatches: boolean) =>
  ({ type, profileMatches: () => profileMatches }) as unknown as CardStack;

const playerWith = (stacks: CardStack[]) => ({ cardStacks: stacks }) as unknown as Player;

describe('InfrastructureCard.getValidTargets', () => {
  test('default infrastructure: includes Hull and Colony stacks whose profile matches', () => {
    const hull = mockStack(CardType.Hull, true);
    const colony = mockStack(CardType.Colony, true);
    const result = new TestInfra().getValidTargets(playerWith([hull, colony]));
    expect(result).toEqual([hull, colony]);
  });

  test('default infrastructure: excludes Equipment / Infrastructure / Tactic / Orb stacks', () => {
    const equipment = mockStack(CardType.Equipment, true);
    const infra = mockStack(CardType.Infrastructure, true);
    const tactic = mockStack(CardType.Tactic, true);
    const orb = mockStack(CardType.Orb, true);
    const result = new TestInfra().getValidTargets(playerWith([equipment, infra, tactic, orb]));
    expect(result).toEqual([]);
  });

  test('default infrastructure: excludes stacks whose profile would become invalid', () => {
    const hull = mockStack(CardType.Hull, false);
    const colony = mockStack(CardType.Colony, false);
    const result = new TestInfra().getValidTargets(playerWith([hull, colony]));
    expect(result).toEqual([]);
  });

  test('colony-only infrastructure: excludes Hull stacks even when profile matches', () => {
    const hull = mockStack(CardType.Hull, true);
    const colony = mockStack(CardType.Colony, true);
    const result = new ColonyOnlyInfra().getValidTargets(playerWith([hull, colony]));
    expect(result).toEqual([colony]);
  });

  test('colony-only infrastructure: still respects profile match on the colony', () => {
    const colony = mockStack(CardType.Colony, false);
    const result = new ColonyOnlyInfra().getValidTargets(playerWith([colony]));
    expect(result).toEqual([]);
  });
});
