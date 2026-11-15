import CountdownIndicator from './countdown_indicator';
import { designConfig } from 'src/app/config/design';
import { ClientState, emptyClientState } from '../../../../../server/src/shared/interfaces/client_state';

class MockText {
  setFontSize = jasmine.createSpy('setFontSize').and.returnValue(this);
  setFontFamily = jasmine.createSpy('setFontFamily').and.returnValue(this);
  setColor = jasmine.createSpy('setColor').and.returnValue(this);
  setAlign = jasmine.createSpy('setAlign').and.returnValue(this);
  setOrigin = jasmine.createSpy('setOrigin').and.returnValue(this);
  setText = jasmine.createSpy('setText').and.returnValue(this);
}

const makeScene = (state: ClientState): any => {
  const text = new MockText();
  return {
    state: state,
    text: text,
    add: {
      text: jasmine.createSpy('text').and.returnValue(text)
    }
  };
};

const makeState = (name: string): ClientState => ({
  ...emptyClientState,
  player: { ...emptyClientState.player, name: name }
});

describe('CountdownIndicator', () => {
  it('shows only the player name when no countdown is active', () => {
    const scene = makeScene(makeState('Neptune'));
    const indicator = new CountdownIndicator(scene, true);

    indicator.update();

    expect(scene.text.setText).toHaveBeenCalledWith('Neptune');
  });

  it('prefixes the player name with the formatted countdown', () => {
    const scene = makeScene(makeState('Neptune'));
    const indicator = new CountdownIndicator(scene, true);

    indicator.update(125);

    expect(scene.text.setText).toHaveBeenCalledWith('[02:05]  Neptune');
  });

  it('uses the opponent name for the opponent indicator', () => {
    const state = {
      ...makeState('Player'),
      opponent: { ...emptyClientState.opponent, name: 'Triton' }
    };
    const scene = makeScene(state);
    const indicator = new CountdownIndicator(scene, false);

    indicator.update();

    expect(scene.text.setText).toHaveBeenCalledWith('Triton');
  });

  it('warns in color for countdowns below one minute', () => {
    const scene = makeScene(makeState('Neptune'));
    const indicator = new CountdownIndicator(scene, true);

    indicator.update(42);

    expect(scene.text.setColor.calls.mostRecent().args[0]).toBe(designConfig.color.warn);
  });

  it('stays neutral in color for countdowns of at least one minute', () => {
    const scene = makeScene(makeState('Neptune'));
    const indicator = new CountdownIndicator(scene, true);

    indicator.update(60);

    expect(scene.text.setColor.calls.mostRecent().args[0]).toBe(designConfig.color.neutral);
  });
});
