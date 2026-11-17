import Prompt from './prompt';
import { BattleType, GameResultType, TurnPhase } from '@shared/config/enums';
import { ClientState, emptyClientState } from '@shared/interfaces/client_state';
import { animationConfig } from '../../config/animation';
import { asGameScene, GameObjectStub, makeSceneStub, SceneStub } from '../../testing/phaser_stubs';

const makeScene = (state: ClientState): SceneStub => makeSceneStub({ state });

const makeState = (overrides: Partial<ClientState> = {}): ClientState => ({
  ...emptyClientState,
  ...overrides
});

/** The private Prompt text object, on which the prompt stubs are recorded. */
const textOf = (prompt: Prompt): GameObjectStub => (prompt as unknown as { text: GameObjectStub }).text;

/** The private Prompt background image, on which the prompt stubs are recorded. */
const imageOf = (prompt: Prompt): GameObjectStub => (prompt as unknown as { image: GameObjectStub }).image;

describe('Prompt', () => {
  it('shows the waiting prompt while the opponent is taking their turn', () => {
    const scene = makeScene(makeState({ playerPendingAction: false }));
    const prompt = new Prompt(asGameScene(scene));

    prompt.update();

    expect(textOf(prompt).setText).toHaveBeenCalledWith('Warte auf Gegenspieler...');
    expect(textOf(prompt).setVisible.calls.mostRecent().args[0]).toBeTrue();
    expect(imageOf(prompt).setVisible.calls.mostRecent().args[0]).toBeTrue();
    expect(scene.obj?.exitButton.hide).toHaveBeenCalled();
    expect(scene.time.delayedCall).toHaveBeenCalledWith(
      animationConfig.duration.promptShow,
      jasmine.any(Function)
    );
  });

  it('hides the prompt and keeps the exit button visible while the game is over', () => {
    const scene = makeScene(
      makeState({
        playerPendingAction: false,
        gameResult: { won: false, type: GameResultType.Domination, sol: 0 }
      })
    );
    const prompt = new Prompt(asGameScene(scene));

    prompt.update();

    // Must not fall back to the regular "Warte auf Gegenspieler..." branch
    expect(textOf(prompt).setText).not.toHaveBeenCalled();
    expect(textOf(prompt).setVisible.calls.mostRecent().args[0]).toBeFalse();
    expect(imageOf(prompt).setVisible.calls.mostRecent().args[0]).toBeFalse();
    expect(scene.obj?.exitButton.show).toHaveBeenCalled();
    expect(scene.obj?.exitButton.hide).not.toHaveBeenCalled();
    expect(scene.time.delayedCall).not.toHaveBeenCalled();
  });

  it('does not evaluate any phase branch while the game is over', () => {
    const scene = makeScene(
      makeState({
        playerPendingAction: true,
        turnPhase: TurnPhase.Combat,
        battle: { type: BattleType.Mission, playerShipIds: [], opponentShipIds: [], range: 2 },
        gameResult: { won: true, type: GameResultType.Destruction, sol: 42 }
      })
    );
    const prompt = new Prompt(asGameScene(scene));

    prompt.update();

    expect(textOf(prompt).setText).not.toHaveBeenCalled();
    expect(textOf(prompt).setVisible.calls.mostRecent().args[0]).toBeFalse();
    expect(scene.obj?.exitButton.hide).not.toHaveBeenCalled();
  });

  it('shows the combat phase text with the corrected grammar', () => {
    const scene = makeScene(
      makeState({
        playerPendingAction: true,
        turnPhase: TurnPhase.Combat,
        battle: { type: BattleType.Mission, playerShipIds: [], opponentShipIds: [], range: 3 }
      })
    );
    const prompt = new Prompt(asGameScene(scene));

    prompt.update();

    expect(textOf(prompt).setText).toHaveBeenCalledWith(
      'Aktuelle Reichweite des Gefechts: 3\nFühre Angriffe mit deinen\nWaffensystemen durch!'
    );
  });

  it('keeps the prompt hidden and the exit button visible when show() is called while the game is over', () => {
    const scene = makeScene(makeState({ gameResult: { won: true, type: GameResultType.Surrender, sol: 0 } }));
    const prompt = new Prompt(asGameScene(scene));

    prompt.show();

    expect(textOf(prompt).setVisible.calls.mostRecent().args[0]).toBeFalse();
    expect(imageOf(prompt).setVisible.calls.mostRecent().args[0]).toBeFalse();
    expect(scene.obj?.exitButton.hide).not.toHaveBeenCalled();
  });
});
