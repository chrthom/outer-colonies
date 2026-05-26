import CardStack, { RootCardStack } from './card_stack';
import Card from './card';
import { CardType, Zone } from '../../shared/config/enums';

class MockCard extends Card {
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame(): void {}
  onLeaveGame(): void {}
  onStartTurn(): void {}
  onEndTurn(): void {}
}

class MockPlayer {
  socketId = 'test-player';
  no = 1;
  match = { battle: { recentAttack: null as unknown, range: 1 } };
}

const newStack = (id: number, name: string, type: CardType = CardType.Hull) =>
  new RootCardStack(new MockCard(id, name, type, 1), Zone.Hand, new MockPlayer() as any);

describe('CardStack.attach', () => {
  test('appends the child to attachedCardStacks and clears its zone', () => {
    const parent = newStack(1, 'Parent');
    const child = newStack(2, 'Child', CardType.Equipment);

    parent.attach(child);

    expect(parent.attachedCardStacks).toContain(child);
    expect(child.zone).toBeUndefined();
  });

  test('preserves order when attaching multiple children', () => {
    const parent = newStack(3, 'Parent');
    const child1 = newStack(4, 'Child 1', CardType.Equipment);
    const child2 = newStack(5, 'Child 2', CardType.Equipment);

    parent.attach(child1);
    parent.attach(child2);

    expect(parent.attachedCardStacks).toEqual([child1, child2]);
  });
});

describe('CardStack.rootCardStack', () => {
  test('returns itself when there is no parent', () => {
    const stack = newStack(6, 'Root');
    expect(stack.rootCardStack).toBe(stack);
  });

  test('returns the direct parent when attached one level', () => {
    const parent = newStack(7, 'Parent');
    const child = newStack(8, 'Child', CardType.Equipment);
    parent.attach(child);
    expect(child.rootCardStack).toBe(parent);
  });

  test('walks up multiple levels to the topmost ancestor', () => {
    const grandparent = newStack(9, 'Grandparent');
    const parent = newStack(10, 'Parent', CardType.Equipment);
    const child = newStack(11, 'Child', CardType.Equipment);

    grandparent.attach(parent);
    parent.attach(child);

    expect(child.rootCardStack).toBe(grandparent);
  });
});

describe('CardStack.attack', () => {
  test('sets attackAvailable to false after attacking', () => {
    const attacker = newStack(12, 'Attacker');
    const target = newStack(13, 'Target');

    jest.spyOn(attacker.card, 'attack').mockReturnValue({
      pointDefense: 0,
      shield: 0,
      armour: 0,
      damage: 0
    });

    attacker.attackAvailable = true;
    attacker.attack(target);

    expect(attacker.attackAvailable).toBe(false);
  });
});
