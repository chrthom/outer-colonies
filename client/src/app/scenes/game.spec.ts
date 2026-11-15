import Game from './game';
import { GameResultType, TurnPhase } from '../../../../server/src/shared/config/enums';
import {
  ClientHandCard,
  ClientState,
  emptyClientState
} from '../../../../server/src/shared/interfaces/client_state';
import { animationConfig } from '../config/animation';

/**
 * Test double for Phaser's clock: records delayed calls so tests can fire
 * them manually, which makes the state update pipeline testable without
 * Phaser timers.
 */
class FakeClock {
  readonly entries: Array<{ delay: number; callback: () => void }> = [];

  delayedCall = (delay: number, callback: () => void) => {
    this.entries.push({ delay, callback });
  };

  /** Fires and removes the oldest scheduled delayed call (mimics an elapsed timer). */
  fireOldest() {
    const entry = this.entries.shift();
    if (!entry) throw new Error('No delayed call scheduled');
    entry.callback();
  }

  /** Fires all scheduled delayed calls, including those scheduled while firing. */
  fireAll() {
    while (this.entries.length) this.fireOldest();
  }
}

function handCard(uuid: string, cardId = 1): ClientHandCard {
  return {
    uuid,
    cardId,
    index: 0,
    playable: true,
    validTargets: [],
    ownedByPlayer: true,
    optionsToSelect: 0
  };
}

function makeState(over: Partial<ClientState> = {}): ClientState {
  return { ...emptyClientState, ...over };
}

/**
 * Test handle for overriding the private update helpers and Phaser internals
 * of a Game instance with spies and stubs.
 */
interface GameTestOverrides {
  time: { delayedCall: FakeClock['delayedCall'] };
  preloader: { destroy: () => void };
  updateCardStacks: jasmine.Spy;
  updateHandCards: jasmine.Spy;
  updateView: jasmine.Spy;
  highlightAttackIntervention: jasmine.Spy;
  player: { hand: ClientHandCard[]; discardPile: { update: jasmine.Spy } };
  opponent: { hand: ClientHandCard[]; discardPile: { update: jasmine.Spy } };
}

/** Creates a Game instance with a fake clock and spied update helpers. */
function setupGame() {
  const game = new Game();
  const clock = new FakeClock();
  const overrides = game as unknown as GameTestOverrides;
  overrides.time = { delayedCall: clock.delayedCall };
  overrides.preloader = { destroy: () => {} };
  const updateCardStacks = jasmine.createSpy('updateCardStacks');
  const updateHandCards = jasmine.createSpy('updateHandCards');
  const updateView = jasmine.createSpy('updateView');
  const highlightAttackIntervention = jasmine.createSpy('highlightAttackIntervention');
  overrides.updateCardStacks = updateCardStacks;
  overrides.updateHandCards = updateHandCards;
  overrides.updateView = updateView;
  overrides.highlightAttackIntervention = highlightAttackIntervention;
  const playerDiscardPile = jasmine.createSpy('playerDiscardPile.update');
  const opponentDiscardPile = jasmine.createSpy('opponentDiscardPile.update');
  overrides.player = { hand: [], discardPile: { update: playerDiscardPile } };
  overrides.opponent = { hand: [], discardPile: { update: opponentDiscardPile } };
  return {
    game,
    clock,
    updateCardStacks,
    updateHandCards,
    updateView,
    highlightAttackIntervention,
    playerDiscardPile,
    opponentDiscardPile
  };
}

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

describe('Game scene - state update pipeline', () => {
  it('runs the full update chain for a single state', () => {
    const {
      game,
      clock,
      updateCardStacks,
      updateHandCards,
      updateView,
      highlightAttackIntervention,
      playerDiscardPile,
      opponentDiscardPile
    } = setupGame();
    const state = makeState({
      turnPhase: TurnPhase.Build,
      player: { ...emptyClientState.player, discardPileIds: [7], hand: [handCard('p1', 10)] },
      opponent: { ...emptyClientState.opponent, discardPileIds: [8] }
    });

    game.updateState(state);
    clock.fireAll();

    expect(updateCardStacks).toHaveBeenCalledTimes(1);
    expect(updateCardStacks).toHaveBeenCalledWith([handCard('p1', 10)]);
    expect(updateHandCards).toHaveBeenCalledTimes(1);
    expect(updateHandCards).toHaveBeenCalledWith([handCard('p1', 10)], TurnPhase.Init);
    expect(updateView).toHaveBeenCalledTimes(1);
    expect(highlightAttackIntervention).toHaveBeenCalledTimes(1);
    expect(playerDiscardPile).toHaveBeenCalledWith([7]);
    expect(opponentDiscardPile).toHaveBeenCalledWith([8]);
  });

  it('renders the newest state when a second state arrives mid-chain', () => {
    const { game, clock, updateCardStacks, updateHandCards, playerDiscardPile, opponentDiscardPile } =
      setupGame();
    const state1 = makeState({
      turnPhase: TurnPhase.Build,
      player: { ...emptyClientState.player, hand: [handCard('p1', 10)] }
    });
    game.updateState(state1);
    clock.fireOldest(); // Chain 1 applied its card stacks step
    const state2 = makeState({
      turnPhase: TurnPhase.Combat,
      player: { ...emptyClientState.player, discardPileIds: [3], hand: [handCard('p2', 20)] },
      opponent: { ...emptyClientState.opponent, discardPileIds: [4] }
    });

    game.updateState(state2); // Supersedes the pending steps of chain 1
    clock.fireAll();

    expect(game.state).toBe(state2);
    // Each chain ran its card stacks step exactly once
    expect(updateCardStacks).toHaveBeenCalledTimes(2);
    // The hand update ran only for the newest state, with the turn phase
    // captured when the superseded state was still current
    expect(updateHandCards).toHaveBeenCalledTimes(1);
    expect(updateHandCards).toHaveBeenCalledWith([handCard('p2', 20)], TurnPhase.Build);
    // The discard piles were updated from the newest state only
    expect(playerDiscardPile).toHaveBeenCalledTimes(1);
    expect(playerDiscardPile).toHaveBeenCalledWith([3]);
    expect(opponentDiscardPile).toHaveBeenCalledWith([4]);
  });

  it('skips every step of a chain that was superseded before it started', () => {
    const { game, clock, updateCardStacks, updateHandCards, playerDiscardPile } = setupGame();
    const state1 = makeState({
      player: { ...emptyClientState.player, discardPileIds: [1], hand: [handCard('p1', 10)] }
    });
    game.updateState(state1);
    const state2 = makeState({
      player: { ...emptyClientState.player, discardPileIds: [2], hand: [handCard('p2', 20)] }
    });

    game.updateState(state2); // Supersedes chain 1 before any of its steps ran
    clock.fireAll();

    expect(updateCardStacks).toHaveBeenCalledTimes(1);
    expect(updateHandCards).toHaveBeenCalledTimes(1);
    expect(updateHandCards).toHaveBeenCalledWith([handCard('p2', 20)], TurnPhase.Init);
    expect(playerDiscardPile).toHaveBeenCalledTimes(1);
    expect(playerDiscardPile).toHaveBeenCalledWith([2]);
  });

  it('waits for the attack animation before updating the card stacks', () => {
    const { game, clock, updateCardStacks } = setupGame();
    const state = makeState({
      battle: {
        ...emptyClientState.battle,
        recentAttack: {
          sourceRootUUID: 'src-root',
          sourceSubUUID: 'src-sub',
          targetUUID: 'target',
          pointDefense: 0,
          shield: 0,
          armour: 0,
          damage: 1
        }
      }
    });

    game.updateState(state);

    expect(game.isAttackAnimating).toBeTrue();
    // The attack animation reset and the chain's first step are both
    // scheduled with the attack duration
    expect(clock.entries.map(e => e.delay)).toEqual([
      animationConfig.duration.attack,
      animationConfig.duration.attack
    ]);
    clock.fireOldest(); // Resets isAttackAnimating
    expect(game.isAttackAnimating).toBeFalse();
    expect(updateCardStacks).not.toHaveBeenCalled();
    clock.fireOldest(); // Chain step 1
    expect(updateCardStacks).toHaveBeenCalledTimes(1);
  });

  it('delays the hand update when a retract animation was detected', () => {
    const { game, clock, updateCardStacks, updateHandCards } = setupGame();
    updateCardStacks.and.callFake(() => (game.retractCardsExist = true));

    game.updateState(makeState());
    clock.fireOldest(); // Step 1 detects a retract via updateCardStacks

    expect(clock.entries[0].delay).toBe(animationConfig.duration.move);
    expect(updateHandCards).not.toHaveBeenCalled();
    clock.fireOldest();
    expect(updateHandCards).toHaveBeenCalledTimes(1);
  });
});
