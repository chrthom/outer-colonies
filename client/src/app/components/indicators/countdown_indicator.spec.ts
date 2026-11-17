import CountdownIndicator from './countdown_indicator';
import { designConfig } from 'src/app/config/design';
import { ClientState, emptyClientState } from '@shared/interfaces/client_state';
import {
  asGameScene,
  GameObjectStub,
  makeGameObjectStub,
  makeSceneStub,
  SceneStub
} from '../../testing/phaser_stubs';

/** Creates a game scene stub from the shared harness whose text double is exposed as `text`. */
const makeScene = (state: ClientState): SceneStub & { text: GameObjectStub } => {
  const text = makeGameObjectStub();
  const scene = Object.assign(makeSceneStub({ state }), { text });
  scene.add.text.and.returnValue(text);
  return scene;
};

const makeState = (name: string): ClientState => ({
  ...emptyClientState,
  player: { ...emptyClientState.player, name: name }
});

describe('CountdownIndicator', () => {
  it('shows only the player name when no countdown is active', () => {
    const scene = makeScene(makeState('Neptune'));
    const indicator = new CountdownIndicator(asGameScene(scene), true);

    indicator.update();

    expect(scene.text.setText).toHaveBeenCalledWith('Neptune');
  });

  it('prefixes the player name with the formatted countdown', () => {
    const scene = makeScene(makeState('Neptune'));
    const indicator = new CountdownIndicator(asGameScene(scene), true);

    indicator.update(125);

    expect(scene.text.setText).toHaveBeenCalledWith('[02:05]  Neptune');
  });

  it('uses the opponent name for the opponent indicator', () => {
    const state = {
      ...makeState('Player'),
      opponent: { ...emptyClientState.opponent, name: 'Triton' }
    };
    const scene = makeScene(state);
    const indicator = new CountdownIndicator(asGameScene(scene), false);

    indicator.update();

    expect(scene.text.setText).toHaveBeenCalledWith('Triton');
  });

  it('warns in color for countdowns below one minute', () => {
    const scene = makeScene(makeState('Neptune'));
    const indicator = new CountdownIndicator(asGameScene(scene), true);

    indicator.update(42);

    expect(scene.text.setColor.calls.mostRecent().args[0]).toBe(designConfig.color.warn);
  });

  it('stays neutral in color for countdowns of at least one minute', () => {
    const scene = makeScene(makeState('Neptune'));
    const indicator = new CountdownIndicator(asGameScene(scene), true);

    indicator.update(60);

    expect(scene.text.setColor.calls.mostRecent().args[0]).toBe(designConfig.color.neutral);
  });
});
