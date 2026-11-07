import CombatRangeIndicator from './combat_range_indicator';
import { BattleType, InterventionType } from '../../../../../server/src/shared/config/enums';
import {
  ClientIntervention,
  ClientState,
  emptyClientState
} from '../../../../../server/src/shared/interfaces/client_state';

class MockImage {
  setOrigin = jasmine.createSpy('setOrigin').and.returnValue(this);
  setVisible = jasmine.createSpy('setVisible').and.returnValue(this);
}

const makeScene = (state: ClientState): any => ({
  state: state,
  add: {
    image: jasmine.createSpy('image').and.callFake(() => new MockImage())
  }
});

const makeState = (range: number, intervention?: ClientIntervention): ClientState => ({
  ...emptyClientState,
  battle: {
    type: BattleType.Raid,
    playerShipIds: [],
    opponentShipIds: [],
    range: range
  },
  intervention: intervention
});

/** Ranges whose indicator image is visible after the last update() call. */
const visibleRanges = (indicator: CombatRangeIndicator): number[] => {
  const images = (indicator as any).images as any[];
  return images
    .map((image, i) => (image.setVisible.calls.mostRecent().args[0] ? i + 1 : 0))
    .filter(range => range > 0);
};

describe('CombatRangeIndicator', () => {
  it('shows the current battle range', () => {
    const indicator = new CombatRangeIndicator(makeScene(makeState(2)));

    indicator.update();

    expect(visibleRanges(indicator)).toEqual([2]);
  });

  it('hides the indicator during a battle round end intervention', () => {
    const indicator = new CombatRangeIndicator(
      makeScene(
        makeState(3, { type: InterventionType.BattleRoundEnd, rootType: InterventionType.BattleRoundEnd })
      )
    );

    indicator.update();

    expect(visibleRanges(indicator)).toEqual([]);
  });

  it('hides the indicator while a (counter) tactic card is pending during the battle round end window', () => {
    const indicator = new CombatRangeIndicator(
      makeScene(
        makeState(3, { type: InterventionType.TacticCard, rootType: InterventionType.BattleRoundEnd })
      )
    );

    indicator.update();

    expect(visibleRanges(indicator)).toEqual([]);
  });

  it('shows the indicator during an attack intervention', () => {
    const indicator = new CombatRangeIndicator(
      makeScene(makeState(2, { type: InterventionType.Attack, rootType: InterventionType.Attack }))
    );

    indicator.update();

    expect(visibleRanges(indicator)).toEqual([2]);
  });

  it('shows the indicator while a tactic card is pending during an attack intervention', () => {
    const indicator = new CombatRangeIndicator(
      makeScene(makeState(2, { type: InterventionType.TacticCard, rootType: InterventionType.Attack }))
    );

    indicator.update();

    expect(visibleRanges(indicator)).toEqual([2]);
  });

  it('hides the indicator for the pre-battle placeholder range', () => {
    const indicator = new CombatRangeIndicator(makeScene(makeState(5)));

    indicator.update();

    expect(visibleRanges(indicator)).toEqual([]);
  });
});
