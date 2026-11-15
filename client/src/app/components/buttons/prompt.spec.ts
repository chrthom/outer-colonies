import Prompt from './prompt';
import { BattleType, GameResultType, TurnPhase } from '@shared/config/enums';
import { ClientState, emptyClientState } from '@shared/interfaces/client_state';
import { animationConfig } from '../../config/animation';
import Game from '../../scenes/game';

interface ChainableStub {
  setDepth: jasmine.Spy;
  setOrigin: jasmine.Spy;
  setScale: jasmine.Spy;
  setFontSize: jasmine.Spy;
  setFontFamily: jasmine.Spy;
  setColor: jasmine.Spy;
  setAlign: jasmine.Spy;
  setText: jasmine.Spy;
  setVisible: jasmine.Spy;
}

const chainable = (): ChainableStub => {
  const stub = {} as ChainableStub;
  (
    [
      'setDepth',
      'setOrigin',
      'setScale',
      'setFontSize',
      'setFontFamily',
      'setColor',
      'setAlign',
      'setText',
      'setVisible'
    ] as Array<keyof ChainableStub>
  ).forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
  return stub;
};

interface SceneStub {
  state: ClientState;
  plannedBattle: { type: BattleType; shipIds: string[] };
  add: { image: jasmine.Spy; text: jasmine.Spy };
  time: { delayedCall: jasmine.Spy };
  obj: { exitButton: { show: jasmine.Spy; hide: jasmine.Spy } };
}

const makeScene = (state: ClientState): SceneStub => ({
  state: state,
  plannedBattle: { type: BattleType.None, shipIds: [] },
  add: {
    image: jasmine.createSpy('image').and.callFake(chainable),
    text: jasmine.createSpy('text').and.callFake(chainable)
  },
  time: {
    delayedCall: jasmine.createSpy('delayedCall')
  },
  obj: {
    exitButton: {
      show: jasmine.createSpy('exitButton.show'),
      hide: jasmine.createSpy('exitButton.hide')
    }
  }
});

const makeState = (overrides: Partial<ClientState> = {}): ClientState => ({
  ...emptyClientState,
  ...overrides
});

/** The private Prompt text object, on which the prompt stubs are recorded. */
const textOf = (prompt: Prompt): { setText: jasmine.Spy; setVisible: jasmine.Spy } =>
  (prompt as unknown as { text: { setText: jasmine.Spy; setVisible: jasmine.Spy } }).text;

describe('Prompt', () => {
  it('shows the waiting prompt while the opponent is taking their turn', () => {
    const scene = makeScene(makeState({ playerPendingAction: false }));
    const prompt = new Prompt(scene as unknown as Game);

    prompt.update();

    expect(textOf(prompt).setText).toHaveBeenCalledWith('Warte auf Gegenspieler...');
    expect(textOf(prompt).setVisible.calls.mostRecent().args[0]).toBeTrue();
    expect(
      (prompt as unknown as { image: ChainableStub }).image.setVisible.calls.mostRecent().args[0]
    ).toBeTrue();
    expect(scene.obj.exitButton.hide).toHaveBeenCalled();
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
    const prompt = new Prompt(scene as unknown as Game);

    prompt.update();

    // Must not fall back to the regular "Warte auf Gegenspieler..." branch
    expect(textOf(prompt).setText).not.toHaveBeenCalled();
    expect(textOf(prompt).setVisible.calls.mostRecent().args[0]).toBeFalse();
    expect(
      (prompt as unknown as { image: ChainableStub }).image.setVisible.calls.mostRecent().args[0]
    ).toBeFalse();
    expect(scene.obj.exitButton.show).toHaveBeenCalled();
    expect(scene.obj.exitButton.hide).not.toHaveBeenCalled();
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
    const prompt = new Prompt(scene as unknown as Game);

    prompt.update();

    expect(textOf(prompt).setText).not.toHaveBeenCalled();
    expect(textOf(prompt).setVisible.calls.mostRecent().args[0]).toBeFalse();
    expect(scene.obj.exitButton.hide).not.toHaveBeenCalled();
  });

  it('shows the combat phase text with the corrected grammar', () => {
    const scene = makeScene(
      makeState({
        playerPendingAction: true,
        turnPhase: TurnPhase.Combat,
        battle: { type: BattleType.Mission, playerShipIds: [], opponentShipIds: [], range: 3 }
      })
    );
    const prompt = new Prompt(scene as unknown as Game);

    prompt.update();

    expect(textOf(prompt).setText).toHaveBeenCalledWith(
      'Aktuelle Reichweite des Gefechts: 3\nFühre Angriffe mit deinen\nWaffensystemen durch!'
    );
  });

  it('keeps the prompt hidden and the exit button visible when show() is called while the game is over', () => {
    const scene = makeScene(makeState({ gameResult: { won: true, type: GameResultType.Surrender, sol: 0 } }));
    const prompt = new Prompt(scene as unknown as Game);

    prompt.show();

    expect(textOf(prompt).setVisible.calls.mostRecent().args[0]).toBeFalse();
    expect(
      (prompt as unknown as { image: ChainableStub }).image.setVisible.calls.mostRecent().args[0]
    ).toBeFalse();
    expect(scene.obj.exitButton.hide).not.toHaveBeenCalled();
  });
});
