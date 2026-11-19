import OnlineIndicator from './online_indicator';
import { asGameScene, GameObjectStub, makeGameObjectStub, makeSceneStub } from '../../testing/phaser_stubs';

const makeIndicator = (): { indicator: OnlineIndicator; text: GameObjectStub } => {
  const text = makeGameObjectStub();
  const scene = makeSceneStub();
  scene.add.text.and.returnValue(text);
  return { indicator: new OnlineIndicator(asGameScene(scene)), text };
};

describe('OnlineIndicator', () => {
  it('shows no text before the first count arrives', () => {
    const { text } = makeIndicator();

    expect(text.setText).not.toHaveBeenCalled();
  });

  it('shows the number of online players', () => {
    const { indicator, text } = makeIndicator();

    indicator.setCount(12);

    expect(text.setText).toHaveBeenCalledWith('12 Spieler online');
  });

  it('replaces the text on every update', () => {
    const { indicator, text } = makeIndicator();

    indicator.setCount(12);
    indicator.setCount(3);

    expect(text.setText).toHaveBeenCalledTimes(2);
    expect(text.setText.calls.mostRecent().args).toEqual(['3 Spieler online']);
  });
});
