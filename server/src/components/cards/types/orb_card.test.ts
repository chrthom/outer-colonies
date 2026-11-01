import { CardType, TacticDiscipline } from '../../../shared/config/enums';
import ActionPool from '../action_pool';
import CardStack from '../card_stack';
import Player from '../../game_state/player';
import OrbCard from './orb_card';

class TestOrb extends OrbCard {
  constructor() {
    super(1, 'Test Orb', 1, {}, [CardType.Equipment, CardType.Hull], [TacticDiscipline.Military]);
  }
  onStartTurn(): void {}
}

interface OrbStub {
  type: CardType;
  discard: jest.Mock;
}

const orbStub = (): OrbStub => ({ type: CardType.Orb, discard: jest.fn() });
const nonOrbStub = (type: CardType): OrbStub => ({ type, discard: jest.fn() });

const playerWith = (attached: OrbStub[]) => {
  const pushed: any[] = [];
  return {
    captured: pushed,
    player: {
      colonyCardStack: { cardStacks: attached },
      actionPool: { push: (...items: any[]) => pushed.push(...items) }
    } as unknown as Player
  };
};

describe('OrbCard.onEnterGame', () => {
  test('discards every orb already attached to the colony', () => {
    const oldOrb = orbStub();
    const { player } = playerWith([oldOrb]);
    new TestOrb().onEnterGame(player);
    expect(oldOrb.discard).toHaveBeenCalledTimes(1);
  });

  test('discards multiple existing orbs', () => {
    const orb1 = orbStub();
    const orb2 = orbStub();
    const { player } = playerWith([orb1, orb2]);
    new TestOrb().onEnterGame(player);
    expect(orb1.discard).toHaveBeenCalledTimes(1);
    expect(orb2.discard).toHaveBeenCalledTimes(1);
  });

  test('does not discard non-orb stacks on the colony', () => {
    const infra = nonOrbStub(CardType.Infrastructure);
    const equip = nonOrbStub(CardType.Equipment);
    const { player } = playerWith([infra, equip]);
    new TestOrb().onEnterGame(player);
    expect(infra.discard).not.toHaveBeenCalled();
    expect(equip.discard).not.toHaveBeenCalled();
  });

  test('pushes the orb actions onto the player action pool', () => {
    const orb = new TestOrb();
    const { player, captured } = playerWith([]);
    orb.onEnterGame(player);

    // OrbCard.actionPool exposes one CardAction per slot list from the constructor.
    const expected = orb.actionPool.pool;
    expect(captured).toEqual(expected);
    expect(expected).toHaveLength(2);
    expect(orb.actionPool).toBeInstanceOf(ActionPool);
  });

  test('discards old orbs AND pushes new actions in the same call', () => {
    const oldOrb = orbStub();
    const { player, captured } = playerWith([oldOrb]);
    new TestOrb().onEnterGame(player);
    expect(oldOrb.discard).toHaveBeenCalledTimes(1);
    expect(captured.length).toBeGreaterThan(0);
  });
});
