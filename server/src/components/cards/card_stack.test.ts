import CardStack, { RootCardStack } from './card_stack';
import Card from './card';
import { CardDurability, CardType, Zone } from '../../shared/config/enums';

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
  cardStacks: CardStack[] = [];
  hand: CardStack[] = [];
  discardCards = jest.fn();
  takeCards = jest.fn();
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

describe('CardStack.player ownership', () => {
  test('resolves to the attaching player for cards attached to an opponent stack', () => {
    const player = new MockPlayer();
    const opponent = new MockPlayer();
    const ship = new RootCardStack(new MockCard(1, 'Ship', CardType.Hull, 1), Zone.Orbital, opponent as any);
    const tactic = new RootCardStack(
      new MockCard(2, 'Kopfgeld', CardType.Tactic, 1),
      Zone.Hand,
      player as any
    );

    ship.attach(tactic);

    expect(tactic.player).toBe(player);
    expect(tactic.rootCardStack).toBe(ship);
  });

  test('resolves through the parent chain for own stacks without a recorded owner', () => {
    const player = new MockPlayer();
    const ship = new RootCardStack(new MockCard(3, 'Ship', CardType.Hull, 1), Zone.Orbital, player as any);
    const equipment = new RootCardStack(
      new MockCard(4, 'Schild', CardType.Equipment, 1),
      Zone.Hand,
      player as any
    );

    ship.attach(equipment);

    expect(equipment.player).toBe(player);
  });
});

describe('CardStack.retract', () => {
  test('routes retractable cards to the stack owner hand and opponent attachments to their pile', () => {
    const owner = new MockPlayer();
    const opponent = new MockPlayer();
    const shipCard = new MockCard(1, 'Ship', CardType.Hull, 1);
    const ship = new RootCardStack(shipCard, Zone.Orbital, owner as any);
    owner.cardStacks.push(ship);
    const tacticCard = new MockCard(2, 'Kopfgeld', CardType.Tactic, 1);
    jest.spyOn(tacticCard, 'canBeRetracted').mockReturnValue(false);
    const tactic = new RootCardStack(tacticCard, Zone.Hand, opponent as any);
    ship.attach(tactic);

    ship.retract();

    expect(owner.takeCards).toHaveBeenCalledWith([shipCard]);
    expect(opponent.discardCards).toHaveBeenCalledWith(tacticCard);
    expect(owner.discardCards).not.toHaveBeenCalled();
  });
});

describe('CardStack.discard', () => {
  test('discards a card attached to an opponent stack to the owning player pile', () => {
    const owner = new MockPlayer();
    const opponent = new MockPlayer();
    const ship = new RootCardStack(new MockCard(1, 'Ship', CardType.Hull, 1), Zone.Orbital, owner as any);
    const tacticCard = new MockCard(2, 'Kopfgeld', CardType.Tactic, 1);
    const tactic = new RootCardStack(tacticCard, Zone.Hand, opponent as any);
    ship.attach(tactic);

    tactic.discard();

    expect(opponent.discardCards).toHaveBeenCalledWith(tacticCard);
    expect(owner.discardCards).not.toHaveBeenCalled();
    expect(ship.attachedCardStacks).not.toContain(tactic);
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

describe('CardStack.playHandCard', () => {
  const setup = (
    sourceType: CardType,
    targetType: CardType,
    opts: { durability?: CardDurability; isAttachSelfManaging?: boolean } = {}
  ) => {
    const player = new MockPlayer();
    const source = new RootCardStack(new MockCard(1, 'Source', sourceType, 1), Zone.Hand, player as any);
    const target = new RootCardStack(new MockCard(2, 'Target', targetType, 1), Zone.Hand, player as any);
    if (opts.durability !== undefined) {
      jest.spyOn(source.card, 'durability', 'get').mockReturnValue(opts.durability);
    }
    if (opts.isAttachSelfManaging !== undefined) {
      jest.spyOn(source.card, 'isAttachSelfManaging', 'get').mockReturnValue(opts.isAttachSelfManaging);
    }
    const onEnterGameSpy = jest.spyOn(source.card, 'onEnterGame');
    const attachSpy = jest.spyOn(target, 'attach').mockImplementation(() => {});
    return { player, source, target, onEnterGameSpy, attachSpy };
  };

  test('no-op when the source is not in the Hand zone', () => {
    const { player, source, target, onEnterGameSpy, attachSpy } = setup(CardType.Hull, CardType.Colony);
    source.zone = Zone.Colony;

    source.playHandCard(target);

    expect(onEnterGameSpy).not.toHaveBeenCalled();
    expect(player.discardCards).not.toHaveBeenCalled();
    expect(attachSpy).not.toHaveBeenCalled();
    expect(player.cardStacks).toHaveLength(0);
  });

  test('Instant durability: discards source card, no attach, no push', () => {
    const { player, source, target, attachSpy } = setup(CardType.Tactic, CardType.Hull, {
      durability: CardDurability.Instant
    });

    source.playHandCard(target);

    expect(player.discardCards).toHaveBeenCalledWith(source.card);
    expect(attachSpy).not.toHaveBeenCalled();
    expect(player.cardStacks).toHaveLength(0);
  });

  test('non-Orb card targeting Colony: pushed to player.cardStacks with zone = Colony', () => {
    const { player, source, target, attachSpy } = setup(CardType.Infrastructure, CardType.Colony);

    source.playHandCard(target);

    expect(player.cardStacks).toContain(source);
    expect(source.zone).toBe(Zone.Colony);
    expect(attachSpy).not.toHaveBeenCalled();
    expect(player.discardCards).not.toHaveBeenCalled();
  });

  test('Orb card targeting Colony: attached to the target', () => {
    const { player, source, target, attachSpy } = setup(CardType.Orb, CardType.Colony);

    source.playHandCard(target);

    expect(attachSpy).toHaveBeenCalledWith(source);
    expect(player.cardStacks).toHaveLength(0);
  });

  test('targeting a non-Colony stack: attached to the target', () => {
    const { player, source, target, attachSpy } = setup(CardType.Equipment, CardType.Hull);

    source.playHandCard(target);

    expect(attachSpy).toHaveBeenCalledWith(source);
    expect(player.cardStacks).toHaveLength(0);
  });

  test('isAttachSelfManaging: onEnterGame fires but discard / push / attach do not', () => {
    const { player, source, target, onEnterGameSpy, attachSpy } = setup(CardType.Tactic, CardType.Colony, {
      isAttachSelfManaging: true
    });

    source.playHandCard(target);

    expect(onEnterGameSpy).toHaveBeenCalled();
    expect(player.discardCards).not.toHaveBeenCalled();
    expect(attachSpy).not.toHaveBeenCalled();
    expect(player.cardStacks).toHaveLength(0);
  });
});
