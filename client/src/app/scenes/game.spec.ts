import Game from './game';
import { GameResultType } from '../../../../server/src/shared/config/enums';
import { ClientState, emptyClientState } from '../../../../server/src/shared/interfaces/client_state';
function makeRenderStubs() {
  // GameOverIndicator calls scene.add.image(...).setOrigin().setDepth().setAlpha()
  // and scene.add.text(...).setFontSize().setFontFamily().setColor().setDepth()
  //   .setOrigin().setAlpha() then accesses postFX.addShadow.
  // Return chainable stubs so the whole call sequence is non-throwing.
  const chainable = (): any => {
    const stub: any = {
      postFX: { addShadow: jasmine.createSpy('addShadow'), addShine: jasmine.createSpy('addShine') }
    };
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
    ].forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
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
    (game as any).add = stubs.add;
    (game as any).tweens = stubs.tweens;
    game.state = emptyClientState;
  });

  it('synthesises a surrender ClientGameResult and renders the indicator', () => {
    game.showSurrenderOnDisconnect();

    expect(game.state.gameResult).toBeDefined();
    expect(game.state.gameResult?.won).toBeFalse();
    expect(game.state.gameResult?.type).toBe(GameResultType.Surrender);
    expect(game.state.gameResult?.sol).toBe(0);
    // The GameOverIndicator constructor renders three text labels and one image.
    expect((game as any).add.image as jasmine.Spy).toHaveBeenCalled();
    expect((game as any).add.text as jasmine.Spy).toHaveBeenCalled();
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
    expect((game as any).add.image as jasmine.Spy).not.toHaveBeenCalled();
  });
});

describe('Game scene - updateState', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
    (game as any).preloader = { destroy: jasmine.createSpy('preloader.destroy') };
    (game as any).time = { delayedCall: jasmine.createSpy('time.delayedCall') };
  });

  function makeOptionPickerStub(isValidFor: boolean) {
    return {
      destroy: jasmine.createSpy('destroy'),
      isValidFor: jasmine.createSpy('isValidFor').and.returnValue(isValidFor)
    };
  }

  it('destroys a pending option picker that the incoming state invalidated', () => {
    const optionPicker = makeOptionPickerStub(false);
    (game as any).obj = { optionPicker };
    const state: ClientState = { ...emptyClientState };

    game.updateState(state);

    expect(optionPicker.isValidFor).toHaveBeenCalledWith(state);
    expect(optionPicker.destroy).toHaveBeenCalled();
  });

  it('keeps a pending option picker whose action is still valid', () => {
    const optionPicker = makeOptionPickerStub(true);
    (game as any).obj = { optionPicker };

    game.updateState({ ...emptyClientState });

    expect(optionPicker.isValidFor).toHaveBeenCalled();
    expect(optionPicker.destroy).not.toHaveBeenCalled();
    expect((game as any).obj.optionPicker).toBe(optionPicker);
  });

  it('ignores incoming states while no option picker is pending', () => {
    (game as any).obj = {};

    expect(() => game.updateState({ ...emptyClientState })).not.toThrow();
  });
});
