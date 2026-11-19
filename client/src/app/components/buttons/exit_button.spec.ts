import ExitButton from './exit_button';
import Matchmaking from '../../scenes/matchmaking';
import { makeAddStub } from '../../testing/phaser_stubs';
import Phaser from 'phaser';

/** Creates a matchmaking scene with stubbed Phaser internals, like game.spec.ts does for the Game scene. */
function makeMatchmakingScene(): Matchmaking {
  const scene = new Matchmaking();
  scene.add = makeAddStub() as unknown as Phaser.GameObjects.GameObjectFactory;
  return scene;
}

/** Returns the text label the button currently shows. */
function labelOf(button: ExitButton): string {
  const text = (button as unknown as { text: { setText: jasmine.Spy } }).text;
  return text.setText.calls.mostRecent().args[0];
}

describe('ExitButton on the matchmaking scene', () => {
  it('offers cancelling the search while it is running', () => {
    const scene = makeMatchmakingScene();

    const button = new ExitButton(scene);

    expect(labelOf(button)).toBe('Spielersuche abbrechen');
  });
});
