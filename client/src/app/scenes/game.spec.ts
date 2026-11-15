import Game from './game';
import { GameResultType } from '../../../../server/src/shared/config/enums';
import {
  ClientGameResult,
  ClientState,
  emptyClientState
} from '../../../../server/src/shared/interfaces/client_state';

function makeRenderStubs() {
  // GameOverIndicator calls scene.add.image(...).setOrigin().setDepth().setAlpha()
  // and scene.add.text(...).setFontSize().setFontFamily().setColor().setDepth()
  //   .setOrigin().setAlpha() then accesses postFX.addShadow.
  // Background (constructed by Game.init()) additionally calls scene.add.group(),
  // scene.time.delayedCall(...) and chains setAngle(), setScale() and setTint().
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
      'setVisible',
      'setAngle',
      'setScale',
      'setTint'
    ].forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
    return stub;
  };
  return {
    add: {
      group: jasmine.createSpy('group').and.returnValue({}),
      image: jasmine.createSpy('image').and.callFake(chainable),
      text: jasmine.createSpy('text').and.callFake(chainable),
      particles: jasmine.createSpy('particles').and.callFake(chainable)
    },
    time: { delayedCall: jasmine.createSpy('delayedCall') },
    tweens: { add: jasmine.createSpy('tweens.add') }
  };
}

/** The GameOverIndicator constructor renders one image and three text labels. */
function expectSingleIndicator(game: Game) {
  expect((game as any).add.image as jasmine.Spy).toHaveBeenCalledTimes(1);
  expect((game as any).add.text as jasmine.Spy).toHaveBeenCalledTimes(3);
}

function makeGame(): Game {
  const game = new Game();
  const stubs = makeRenderStubs();
  (game as any).add = stubs.add;
  (game as any).time = stubs.time;
  (game as any).tweens = stubs.tweens;
  game.state = emptyClientState;
  return game;
}

describe('Game scene - showSurrenderOnDisconnect', () => {
  let game: Game;

  beforeEach(() => {
    game = makeGame();
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

describe('Game scene - showGameOverIndicator', () => {
  let game: Game;

  beforeEach(() => {
    game = makeGame();
  });

  it('creates the overlay exactly once regardless of how often it is called', () => {
    const result: ClientGameResult = { won: true, type: GameResultType.Domination, sol: 42 };

    game.showGameOverIndicator(result);
    game.showGameOverIndicator(result);
    game.showGameOverIndicator({ ...result, sol: 0 });

    expectSingleIndicator(game);
  });

  it('does not create a second overlay when updates follow a disconnect surrender', () => {
    game.showSurrenderOnDisconnect();

    // Simulates the ContinueButton.update() path after further updateView() calls
    game.showGameOverIndicator(game.state.gameResult!);
    game.showGameOverIndicator(game.state.gameResult!);

    expectSingleIndicator(game);
  });

  it('shows a fresh overlay in the next match after init() resets the reference', () => {
    game.showSurrenderOnDisconnect();

    game.init({
      gameParams: { preloadCardIds: [] },
      socket: { io: { reconnection: () => undefined } } as any
    });
    ((game as any).add.image as jasmine.Spy).calls.reset();
    ((game as any).add.text as jasmine.Spy).calls.reset();

    game.showGameOverIndicator({ won: true, type: GameResultType.Domination, sol: 5 });

    expectSingleIndicator(game);
  });
});
