import Game from './game';
import { GameResultType } from '../../../../server/src/shared/config/enums';
import { ClientState, emptyClientState } from '../../../../server/src/shared/interfaces/client_state';

interface ChainableStub {
  postFX: { addShadow: jasmine.Spy; addShine: jasmine.Spy };
  setOrigin: jasmine.Spy;
  setDepth: jasmine.Spy;
  setAlpha: jasmine.Spy;
  setFontSize: jasmine.Spy;
  setFontFamily: jasmine.Spy;
  setColor: jasmine.Spy;
  setAlign: jasmine.Spy;
  setText: jasmine.Spy;
  setVisible: jasmine.Spy;
}

interface RenderStubs {
  add: { image: jasmine.Spy; text: jasmine.Spy; particles: jasmine.Spy };
  tweens: { add: jasmine.Spy };
}

function makeRenderStubs(): RenderStubs {
  // GameOverIndicator calls scene.add.image(...).setOrigin().setDepth().setAlpha()
  // and scene.add.text(...).setFontSize().setFontFamily().setColor().setDepth()
  //   .setOrigin().setAlpha() then accesses postFX.addShadow.
  // Return chainable stubs so the whole call sequence is non-throwing.
  const chainable = (): ChainableStub => {
    const stub = {
      postFX: { addShadow: jasmine.createSpy('addShadow'), addShine: jasmine.createSpy('addShine') }
    } as ChainableStub;
    (
      [
        'setOrigin',
        'setDepth',
        'setAlpha',
        'setFontSize',
        'setFontFamily',
        'setColor',
        'setAlign',
        'setText',
        'setVisible'
      ] as Array<keyof Omit<ChainableStub, 'postFX'>>
    ).forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
    return stub;
  };
  return {
    add: {
      image: jasmine.createSpy('image').and.callFake(chainable),
      text: jasmine.createSpy('text').and.callFake(chainable),
      particles: jasmine.createSpy('particles').and.callFake(chainable)
    },
    tweens: { add: jasmine.createSpy('tweens.add') }
  };
}

describe('Game scene - showSurrenderOnDisconnect', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
    const stubs = makeRenderStubs();
    game.add = stubs.add as unknown as Phaser.GameObjects.GameObjectFactory;
    game.tweens = stubs.tweens as unknown as Phaser.Tweens.TweenManager;
    game.state = emptyClientState;
  });

  it('synthesises a surrender ClientGameResult and renders the indicator', () => {
    game.showSurrenderOnDisconnect();

    expect(game.state.gameResult).toBeDefined();
    expect(game.state.gameResult?.won).toBeFalse();
    expect(game.state.gameResult?.type).toBe(GameResultType.Surrender);
    expect(game.state.gameResult?.sol).toBe(0);
    // The GameOverIndicator constructor renders three text labels and one image.
    expect(game.add.image as unknown as jasmine.Spy).toHaveBeenCalled();
    expect(game.add.text as unknown as jasmine.Spy).toHaveBeenCalled();
  });

  it('does not mutate the shared emptyClientState constant', () => {
    game.showSurrenderOnDisconnect();

    expect(emptyClientState.gameResult).toBeUndefined();
  });

  it('is a no-op when a gameResult is already present', () => {
    const existing: ClientState = {
      ...emptyClientState,
      gameResult: { won: true, type: GameResultType.Domination, sol: 42 }
    };
    game.state = existing;

    game.showSurrenderOnDisconnect();

    expect(game.state).toBe(existing);
    expect(game.state.gameResult?.won).toBeTrue();
    expect(game.add.image as unknown as jasmine.Spy).not.toHaveBeenCalled();
  });
});
