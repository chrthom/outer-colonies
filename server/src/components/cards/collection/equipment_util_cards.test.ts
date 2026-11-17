import CardStack from '../card_stack';
import Player from '../../game_state/player';
import { Card115, Card343 } from './equipment_util_cards';

const shipStack = (damage: number) => ({ damage, rootCardStack: { damage } }) as unknown as CardStack;

describe('Card115 Reparaturnaniten', () => {
  const card = new Card115();

  test('gains 10 hp', () => {
    expect(card.profile.hp).toBe(10);
  });

  test('removes all damage markers at the end of the turn', () => {
    const source = shipStack(17);

    card.onEndTurn({} as Player, source);

    expect(source.rootCardStack.damage).toBe(0);
  });
});

describe('Card343 Selbstreparierender Torso', () => {
  const card = new Card343();

  test('gains 2 hp and repairs 4 damage markers per turn', () => {
    expect(card.profile.hp).toBe(2);
    const source = shipStack(9);

    card.onEndTurn({} as Player, source);

    expect(source.rootCardStack.damage).toBe(5);
  });

  test('repairs ships with less than 4 damage markers completely', () => {
    const source = shipStack(3);

    card.onEndTurn({} as Player, source);

    expect(source.rootCardStack.damage).toBe(0);
  });
});
