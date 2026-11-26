import BotButton from './bot_button';
import Matchmaking from '../../scenes/matchmaking';
import { makeAddStub } from '../../testing/phaser_stubs';
import Phaser from 'phaser';

function makeMatchmakingScene(): Matchmaking {
  const scene = new Matchmaking();
  scene.add = makeAddStub() as unknown as Phaser.GameObjects.GameObjectFactory;
  scene.startBotGame = jasmine.createSpy('startBotGame');
  return scene;
}

describe('BotButton on the matchmaking scene', () => {
  it('renders the bot button label and starts a bot game on left-click', () => {
    const scene = makeMatchmakingScene();

    const button = new BotButton(scene);
    const textStub = (button as unknown as { text: { on: jasmine.Spy } }).text;

    expect((scene.add.text as jasmine.Spy).calls.mostRecent().args[2]).toBe('Gegen Bot spielen');

    const pointerDownHandler = textStub.on.calls.allArgs().find(args => args[0] == 'pointerdown')![1];
    pointerDownHandler({ leftButtonDown: () => false } as unknown as Phaser.Input.Pointer);
    expect(scene.startBotGame).not.toHaveBeenCalled();

    pointerDownHandler({ leftButtonDown: () => true } as unknown as Phaser.Input.Pointer);
    expect(scene.startBotGame).toHaveBeenCalledTimes(1);
  });
});
