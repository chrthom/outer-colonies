import { CardType, TacticDiscipline } from '../../shared/config/enums';
import ActionPool, { CardAction } from './action_pool';
import { Card102 } from './collection/hull_station_cards';
import { Card149 } from './collection/tactic_intelligence_cards';

test('Single action types shall be consumed from the pool before combinations - version: single first', () => {
  const pool = new ActionPool(
    new CardAction(CardType.Hull),
    new CardAction(CardType.Hull, CardType.Equipment, CardType.Infrastructure)
  );
  pool.activate(new Card102());
  expect(pool.pool).toContainEqual(
    new CardAction(CardType.Hull, CardType.Equipment, CardType.Infrastructure)
  );
});

test('Single action types shall be consumed from the pool before combinations - version: combinations first', () => {
  const pool = new ActionPool(
    new CardAction(CardType.Hull, CardType.Equipment, CardType.Infrastructure),
    new CardAction(CardType.Hull)
  );
  pool.activate(new Card102());
  expect(pool.pool).toContainEqual(
    new CardAction(CardType.Hull, CardType.Equipment, CardType.Infrastructure)
  );
});

test('Tactic action subtypes hall be consumed from the pool before generic tactic action - version: generic first', () => {
  const pool = new ActionPool(new CardAction(CardType.Tactic), new CardAction(TacticDiscipline.Intelligence));
  pool.activate(new Card149());
  expect(pool.pool).toContainEqual(new CardAction(TacticDiscipline.Intelligence));
});

test('Tactic action subtypes hall be consumed from the pool before generic tactic action - version: subtype first', () => {
  const pool = new ActionPool(new CardAction(TacticDiscipline.Intelligence), new CardAction(CardType.Tactic));
  pool.activate(new Card149());
  expect(pool.pool).toContainEqual(new CardAction(TacticDiscipline.Intelligence));
});
