import Game from './game';
import { GameResultType } from '../../../../server/src/shared/config/enums';
import { ClientState, emptyClientState } from '../../../../server/src/shared/interfaces/client_state';
import { makeAddStub, makeTweensStub } from '../testing/phaser_stubs';

describe('Game scene - showSurrenderOnDisconnect', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
    (game as any).add = makeAddStub();
    (game as any).tweens = makeTweensStub();
    game.state = emptyClientState;
  });

  it('synthesises a surrender ClientGameResult and renders the indicator', () => {
    game.showSurrenderOnDisconnect();

    expect(game.state.gameResult).toBeDefined();
    expect(game.state.gameResult?.won).toBeFalse();
    expect(game.state.gameResult?.type).toBe(GameResultType.Surrender);
    expect(game.state.gameResult?.sol).toBe(0);
    // The GameOverIndicator constructor renders three text labels and one image.
    expect((game as any).add.image).toHaveBeenCalled();
    expect((game as any).add.text).toHaveBeenCalled();
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
    expect((game as any).add.image).not.toHaveBeenCalled();
  });
});
