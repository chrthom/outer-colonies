import Game from './game';
import SocketService from '../socket_service';
import { GameResultType, MsgTypeOutbound, TurnPhase } from '@shared/config/enums';
import {
  ClientGameResult,
  ClientHandCard,
  ClientState,
  emptyClientState
} from '@shared/interfaces/client_state';
import { animationConfig } from '../config/animation';
import { Socket } from 'socket.io-client';
import Phaser from 'phaser';
import { makeAddStub, makeTimeStub, makeTweensStub } from '../testing/phaser_stubs';

/** Fake socket that records the game listeners registered and removed by the scene. */
interface SocketListenerStub {
  on: jasmine.Spy;
  off: jasmine.Spy;
}

/** Handle for overriding socket lifecycle internals of a Game instance in tests. */
interface GameSocketOverrides {
  socket: SocketListenerStub;
  events: { once: jasmine.Spy };
  registerSocketListeners: () => void;
}

/** Handle for overriding the private socket factory of the SocketService. */
interface SocketServiceOverrides {
  createSocket: () => Socket;
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

/** The GameOverIndicator constructor renders one image and three text labels. */
function expectSingleIndicator(game: Game) {
  expect(game.add.image as unknown as jasmine.Spy).toHaveBeenCalledTimes(1);
  expect(game.add.text as unknown as jasmine.Spy).toHaveBeenCalledTimes(3);
}

/** Creates a Game instance with shared-harness render, clock and tween stubs. */
function makeGame(): Game {
  const game = new Game();
  game.add = makeAddStub() as unknown as Phaser.GameObjects.GameObjectFactory;
  // Game.init() constructs the Background, which schedules via scene.time
  game.time = makeTimeStub() as unknown as Phaser.Time.Clock;
  game.tweens = makeTweensStub() as unknown as Phaser.Tweens.TweenManager;
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

describe('Game scene - socket listener lifecycle', () => {
  let game: Game;
  let socket: SocketListenerStub;
  let shutdownEvent: string;
  let shutdownHandler: () => void;

  beforeEach(() => {
    game = new Game();
    socket = jasmine.createSpyObj('Socket', ['on', 'off']);
    const handle = game as unknown as GameSocketOverrides;
    handle.socket = socket;
    handle.events = {
      once: jasmine.createSpy('events.once').and.callFake((event: string, handler: () => void) => {
        shutdownEvent = event;
        shutdownHandler = handler;
      })
    };
    handle.registerSocketListeners();
  });

  it('registers all game listeners in create()', () => {
    expect(socket.on.calls.allArgs().map(args => args[0])).toEqual([
      MsgTypeOutbound.State,
      MsgTypeOutbound.Countdown,
      'disconnect'
    ]);
  });

  it('binds the listener cleanup to the scene shutdown event', () => {
    expect(shutdownEvent).toBe(Phaser.Scenes.Events.SHUTDOWN);
  });

  it('removes all game listeners on scene shutdown', () => {
    shutdownHandler();

    expect(socket.off.calls.allArgs().map(args => args[0])).toEqual([
      MsgTypeOutbound.State,
      MsgTypeOutbound.Countdown,
      'disconnect'
    ]);
  });

  it('shows the surrender indicator when the socket disconnects', () => {
    game.add = makeAddStub() as unknown as Phaser.GameObjects.GameObjectFactory;
    game.tweens = makeTweensStub() as unknown as Phaser.Tweens.TweenManager;
    game.state = emptyClientState;

    const disconnectHandler = socket.on.calls.allArgs().find(args => args[0] == 'disconnect')![1];
    disconnectHandler();

    expect(game.state.gameResult?.won).toBeFalse();
    expect(game.state.gameResult?.type).toBe(GameResultType.Surrender);
  });
});

describe('Game scene - showGameOverIndicator', () => {
  let game: Game;

  beforeEach(() => {
    game = makeGame();
  });

  afterEach(() => {
    SocketService.disconnect();
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

    // The Game scene fetches its socket from the app-level SocketService, so
    // open a fake connection instead of passing a socket via the init data.
    const socket = jasmine.createSpyObj('Socket', ['disconnect']);
    socket.io = { reconnection: () => undefined };
    spyOn(SocketService as unknown as SocketServiceOverrides, 'createSocket').and.returnValue(socket);
    SocketService.connect();
    game.init({
      gameParams: { preloadCardIds: [] }
    });
    (game.add.image as unknown as jasmine.Spy).calls.reset();
    (game.add.text as unknown as jasmine.Spy).calls.reset();

    game.showGameOverIndicator({ won: true, type: GameResultType.Domination, sol: 5 });

    expectSingleIndicator(game);
  });

  it('destroys a pending option picker that would cover the game over indicator', () => {
    const optionPicker = { destroy: jasmine.createSpy('destroy') };
    (game as any).obj = { optionPicker };

    game.showSurrenderOnDisconnect();

    expect(optionPicker.destroy).toHaveBeenCalled();
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
